import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bell, Users } from 'lucide-react';
import { chatService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';

const AdminChatBox = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [newMessageNotifications, setNewMessageNotifications] = useState(new Set());
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
                        
                        // Si no hay conversación activa, seleccionar automáticamente
                        if (!activeConversation) {
                            loadConversations().then((conversationsData) => {
                                // Buscar y seleccionar la conversación
                                const conv = conversationsData.find(c => c.anonymous_user_id === data.message.from_user_id);
                                if (conv) {
                                    setActiveConversation(conv);
                                    loadMessages(conv.anonymous_user_id);
                                }
                            });
                        } else if (data.message.from_user_id === activeConversation.anonymous_user_id) {
                            setMessages(prev => [...prev, data.message]);
                        }
                        
                        // Actualizar lista de conversaciones
                        loadConversations();
                        
                        // Si el chat está cerrado, abrirlo automáticamente
                        if (!isOpen) {
                            setIsOpen(true);
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
        // Scroll al final cuando se abre el chat o cambia conversación
        if (isOpen && activeConversation) {
            setTimeout(() => {
                scrollToBottom();
            }, 100);
        }
    }, [isOpen, activeConversation]);

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
        if (!newMessage.trim() || !activeConversation) return;

        try {
            await chatService.sendMessage(activeConversation.anonymous_user_id, newMessage.trim());
            setNewMessage('');
            loadMessages(activeConversation.anonymous_user_id);
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

    const totalNotifications = newMessageNotifications.size;
    const hasActiveConversation = activeConversation && Array.isArray(conversations) && conversations.length > 0;

    return (
        <div className="fixed bottom-4 right-20 z-50">
            {/* Botón flotante */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className={`bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-all duration-300 relative ${
                        totalNotifications > 0 ? 'animate-bounce' : ''
                    }`}
                >
                    <Users className="h-6 w-6" />
                    {totalNotifications > 0 && (
                        <>
                            <Bell className="absolute -top-1 -left-1 h-4 w-4 text-yellow-400 animate-pulse" />
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                                {totalNotifications > 9 ? '9+' : totalNotifications}
                            </span>
                        </>
                    )}
                </button>
            )}

            {/* Ventana de chat */}
            {isOpen && (
                <div className="bg-white rounded-lg shadow-xl border w-96 h-96 flex flex-col">
                    {/* Header */}
                    <div className="bg-blue-600 text-white p-3 rounded-t-lg flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Users className="h-5 w-5" />
                            <span className="font-medium text-sm">
                                Chat Admin{Array.isArray(conversations) ? ` - ${conversations.length} conversación(es)` : ''}
                            </span>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-blue-200 hover:text-white"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="flex-1 flex flex-col">
                        {!Array.isArray(conversations) || conversations.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
                                <div className="text-center">
                                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                    <p>No hay conversaciones activas</p>
                                    <p className="text-xs mt-1">Las conversaciones aparecerán aquí cuando los usuarios envíen mensajes</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Header con info del usuario activo */}
                                {activeConversation && (
                                    <div className="border-b p-3 bg-gray-50">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-medium text-sm text-gray-900">
                                                    Chat con {activeConversation.anonymous_user_name}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    Última actividad: {new Date(activeConversation.last_message_at).toLocaleString()}
                                                </div>
                                            </div>
                                            {Array.isArray(conversations) && conversations.length > 1 && (
                                                <div className="text-xs text-gray-500">
                                                    {conversations.length} conversación(es) total
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Área de mensajes */}
                                {!activeConversation ? (
                                    <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
                                        Cargando conversación...
                                    </div>
                                ) : (
                                <>
                                    {/* Mensajes */}
                                    <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-white">
                                        {loading ? (
                                            <div className="flex items-center justify-center py-4">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                            </div>
                                        ) : messages.length === 0 ? (
                                            <div className="text-center text-gray-500 text-sm py-4">
                                                No hay mensajes
                                            </div>
                                        ) : (
                                            messages.map((message) => (
                                                <div
                                                    key={message.id}
                                                    className={`flex ${
                                                        message.from_user_id === user.id ? 'justify-end' : 'justify-start'
                                                    }`}
                                                >
                                                    <div
                                                        className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                                                            message.from_user_id === user.id
                                                                ? 'bg-blue-600 text-white'
                                                                : 'bg-gray-200 text-gray-900'
                                                        }`}
                                                    >
                                                        <div>{message.message}</div>
                                                        <div className={`text-xs mt-1 ${
                                                            message.from_user_id === user.id ? 'text-blue-100' : 'text-gray-500'
                                                        }`}>
                                                            {formatTime(message.created_at)}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Input para enviar mensaje */}
                                    <div className="border-t p-3">
                                        <div className="flex space-x-2">
                                            <input
                                                type="text"
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                onKeyPress={handleKeyPress}
                                                placeholder="Escribe tu mensaje..."
                                                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                            <button
                                                onClick={sendMessage}
                                                disabled={!newMessage.trim()}
                                                className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Send className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminChatBox;