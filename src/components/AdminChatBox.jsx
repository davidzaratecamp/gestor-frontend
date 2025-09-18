import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bell, Users, Minimize2, Maximize2 } from 'lucide-react';
import { chatService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';

const AdminChatBox = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [hasNewMessage, setHasNewMessage] = useState(false);
    const messagesEndRef = useRef(null);
    const socketRef = useRef(null);

    // Solo mostrar para Hanny admin
    if (user?.username !== 'hannycita10') {
        return null;
    }

    useEffect(() => {
        const initializeChat = async () => {
            try {
                const conversationsData = await loadConversations();
                
                // Auto-seleccionar la primera conversación si existe
                if (conversationsData.length > 0 && !activeConversation) {
                    setActiveConversation(conversationsData[0]);
                    await loadMessages(conversationsData[0].anonymous_user_id);
                }
            } catch (error) {
                console.error('Error inicializando chat admin:', error);
            }
        };

        initializeChat();
        
        // Configurar WebSocket
        if (user?.id) {
            try {
                const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://31.97.138.23:5001';
                socketRef.current = io(socketUrl);
                
                // Autenticar usuario
                socketRef.current.emit('authenticate', user.id);
                
                // Escuchar nuevos mensajes
                socketRef.current.on('new_message', (data) => {
                    try {
                        console.log('Admin recibió nuevo mensaje:', data);
                        
                        // Agregar mensaje a la lista
                        setMessages(prev => [...prev, data.message]);
                        
                        // Si no hay conversación activa, seleccionar automáticamente
                        if (!activeConversation) {
                            loadConversations().then((conversationsData) => {
                                // Buscar y seleccionar la conversación
                                const conv = conversationsData.find(c => c.anonymous_user_id === data.message.from_user_id);
                                if (conv) {
                                    setActiveConversation(conv);
                                    // No llamar loadMessages aquí porque ya agregamos el mensaje arriba
                                }
                            });
                        }
                        
                        // Actualizar lista de conversaciones
                        loadConversations();
                        
                        // Si el chat está cerrado, mostrar notificación y abrir automáticamente
                        if (!isOpen) {
                            setHasNewMessage(true);
                            setIsOpen(true);
                            setUnreadCount(prev => prev + 1);
                        }
                    } catch (error) {
                        console.error('Error procesando mensaje nuevo:', error);
                    }
                });

                socketRef.current.on('connect_error', (error) => {
                    console.error('Error de conexión WebSocket:', error);
                });
                
                return () => {
                    if (socketRef.current) {
                        socketRef.current.disconnect();
                    }
                };
            } catch (error) {
                console.error('Error configurando WebSocket:', error);
            }
        }
    }, [user?.id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        // Scroll al final cuando se abre el chat
        if (isOpen && !isMinimized) {
            setTimeout(() => {
                scrollToBottom();
            }, 100);
        }
    }, [isOpen, isMinimized]);

    const loadConversations = async () => {
        try {
            const response = await chatService.getConversations();
            const conversationsData = Array.isArray(response.data) ? response.data : [];
            setConversations(conversationsData);
            return conversationsData;
        } catch (error) {
            console.error('Error cargando conversaciones:', error);
            setConversations([]);
            return [];
        }
    };

    const loadMessages = async (conversationUserId) => {
        try {
            setLoading(true);
            const response = await chatService.getMessages(conversationUserId);
            setMessages(response.data);
            
            // Remover notificación de esta conversación
            setNewMessageNotifications(prev => {
                const newSet = new Set(prev);
                newSet.delete(conversationUserId);
                return newSet;
            });
        } catch (error) {
            console.error('Error cargando mensajes:', error);
        } finally {
            setLoading(false);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim()) return;
        
        // Usar la conversación activa o la primera disponible
        const currentConversation = activeConversation || conversations[0];
        if (!currentConversation) return;

        try {
            await chatService.sendMessage(currentConversation.anonymous_user_id, newMessage.trim());
            setNewMessage('');
            // Recargar mensajes para mostrar el enviado
            loadMessages(currentConversation.anonymous_user_id);
        } catch (error) {
            console.error('Error enviando mensaje:', error);
            alert('Error al enviar mensaje');
        }
    };

    const selectConversation = (conversation) => {
        setActiveConversation(conversation);
        loadMessages(conversation.anonymous_user_id);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleOpen = () => {
        setIsOpen(true);
        setIsMinimized(false);
        setHasNewMessage(false);
        if (conversations.length > 0 && !activeConversation) {
            setActiveConversation(conversations[0]);
            loadMessages(conversations[0].anonymous_user_id);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };


    return (
        <div className="fixed bottom-4 right-20 z-50">
            {/* Botón flotante */}
            {!isOpen && (
                <button
                    onClick={handleOpen}
                    className={`bg-purple-600 hover:bg-purple-700 text-white rounded-full p-3 shadow-lg transition-all duration-300 relative ${
                        hasNewMessage ? 'animate-bounce' : ''
                    }`}
                >
                    <MessageCircle className="h-6 w-6" />
                    {hasNewMessage && (
                        <Bell className="absolute -top-1 -left-1 h-4 w-4 text-yellow-400 animate-pulse" />
                    )}
                    {unreadCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>
            )}

            {/* Ventana de chat */}
            {isOpen && (
                <div className={`bg-white rounded-lg shadow-xl border transition-all duration-300 ${
                    isMinimized ? 'w-80 h-12' : 'w-80 h-96'
                }`}>
                    {/* Header */}
                    <div className="bg-purple-600 text-white p-3 rounded-t-lg flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span className="font-medium text-sm">
                                Chat con {activeConversation?.anonymous_user_name || 'Usuario Anónimo'}
                            </span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setIsMinimized(!isMinimized)}
                                className="text-purple-200 hover:text-white"
                            >
                                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-purple-200 hover:text-white"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Contenido del chat */}
                    {!isMinimized && (
                        <>
                            {/* Mensajes */}
                            <div className="h-64 overflow-y-auto p-3 space-y-2 bg-white">
                                {messages.length === 0 ? (
                                    <div className="text-center text-gray-500 text-sm mt-8">
                                        <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                        <p>¡Hola! Aquí aparecerán los mensajes de los usuarios anónimos.</p>
                                    </div>
                                ) : (
                                    messages.map((message) => (
                                        <div
                                            key={message.id}
                                            className={`flex ${message.from_user_id === user.id ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                                                    message.from_user_id === user.id
                                                        ? 'bg-purple-600 text-white'
                                                        : 'bg-gray-200 text-gray-800'
                                                }`}
                                            >
                                                <p className="whitespace-pre-wrap">{message.message}</p>
                                                <p className={`text-xs mt-1 ${
                                                    message.from_user_id === user.id ? 'text-purple-200' : 'text-gray-500'
                                                }`}>
                                                    {formatTime(message.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input de mensaje */}
                            <div className="border-t p-3">
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Escribe tu respuesta..."
                                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        disabled={false}
                                    />
                                    <button
                                        onClick={sendMessage}
                                        disabled={!newMessage.trim() || conversations.length === 0 || loading}
                                        className="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Send className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminChatBox;