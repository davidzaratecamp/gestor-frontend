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
        loadConversations();
        
        // Configurar WebSocket
        if (user?.id) {
            const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';
            socketRef.current = io(socketUrl);
            
            // Autenticar usuario
            socketRef.current.emit('authenticate', user.id);
            
            // Escuchar nuevos mensajes
            socketRef.current.on('new_message', (data) => {
                console.log('Admin recibió nuevo mensaje:', data);
                
                // Agregar mensaje a la lista si es de la conversación activa
                if (activeConversation && data.message.from_user_id === activeConversation.anonymous_user_id) {
                    setMessages(prev => [...prev, data.message]);
                } else {
                    // Marcar conversación con notificación
                    setNewMessageNotifications(prev => new Set([...prev, data.message.from_user_id]));
                }
                
                // Actualizar lista de conversaciones
                loadConversations();
                
                // Si el chat está cerrado, abrirlo automáticamente
                if (!isOpen) {
                    setIsOpen(true);
                }
                
                // Reproducir sonido de notificación
                try {
                    new Audio('/notification.mp3').play().catch(() => {});
                } catch (error) {
                    console.log('No se pudo reproducir sonido de notificación');
                }
            });
            
            return () => {
                if (socketRef.current) {
                    socketRef.current.disconnect();
                }
            };
        }
    }, [user?.id, activeConversation]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadConversations = async () => {
        try {
            const response = await chatService.getConversations();
            setConversations(response.data);
        } catch (error) {
            console.error('Error cargando conversaciones:', error);
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
                                Chat Admin - {conversations.length} conversación(es)
                            </span>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-blue-200 hover:text-white"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="flex-1 flex">
                        {/* Lista de conversaciones */}
                        <div className="w-1/3 border-r bg-gray-50 overflow-y-auto">
                            {conversations.length === 0 ? (
                                <div className="p-4 text-center text-gray-500 text-sm">
                                    No hay conversaciones
                                </div>
                            ) : (
                                conversations.map((conv) => (
                                    <div
                                        key={conv.anonymous_user_id}
                                        onClick={() => selectConversation(conv)}
                                        className={`p-3 border-b cursor-pointer hover:bg-gray-100 relative ${
                                            activeConversation?.anonymous_user_id === conv.anonymous_user_id 
                                                ? 'bg-blue-100 border-l-4 border-l-blue-500' 
                                                : ''
                                        }`}
                                    >
                                        <div className="font-medium text-sm text-gray-900">
                                            {conv.anonymous_user_name}
                                        </div>
                                        <div className="text-xs text-gray-500 truncate">
                                            {conv.last_message || 'Sin mensajes'}
                                        </div>
                                        {newMessageNotifications.has(conv.anonymous_user_id) && (
                                            <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Área de mensajes */}
                        <div className="flex-1 flex flex-col">
                            {!activeConversation ? (
                                <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
                                    Selecciona una conversación
                                </div>
                            ) : (
                                <>
                                    {/* Mensajes */}
                                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
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
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminChatBox;