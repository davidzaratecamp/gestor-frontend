import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bell, Users } from 'lucide-react';
import { chatService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';

const AdminChatBox = () => {
    const { user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
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
                        
                        // Chat siempre visible - no necesita abrirse
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
        // Scroll al final cuando cambia conversación
        if (activeConversation) {
            setTimeout(() => {
                scrollToBottom();
            }, 100);
        }
    }, [activeConversation]);

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
        const currentConversation = activeConversation || conversations[0];
        if (!newMessage.trim() || !currentConversation) return;

        try {
            await chatService.sendMessage(currentConversation.anonymous_user_id, newMessage.trim());
            setNewMessage('');
            // Actualizar mensajes de la conversación actual
            if (activeConversation) {
                loadMessages(currentConversation.anonymous_user_id);
            }
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


    // Si no hay conversaciones, no mostrar nada
    if (!Array.isArray(conversations) || conversations.length === 0) {
        return null;
    }

    // Auto-seleccionar la primera conversación si no hay una activa
    const currentConversation = activeConversation || conversations[0];

    return (
        <div className="fixed bottom-4 right-20 z-50">
            {/* Chat directo sin modal - siempre visible cuando hay conversaciones */}
            <div className="bg-white rounded-lg shadow-xl border w-80 h-96 flex flex-col">
                {/* Header simple */}
                <div className="bg-blue-600 text-white p-3 rounded-t-lg flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <MessageCircle className="h-5 w-5" />
                        <span className="font-medium text-sm">
                            Chat con {currentConversation?.anonymous_user_name || 'Usuario'}
                        </span>
                    </div>
                </div>

                {/* Mensajes */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-white">
                    {loading ? (
                        <div className="flex items-center justify-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center text-gray-500 text-sm py-8">
                            <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                            <p>No hay mensajes aún</p>
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
                                    <div className="whitespace-pre-wrap">{message.message}</div>
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
                            placeholder="Escribe tu respuesta..."
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!newMessage.trim() || !currentConversation}
                            className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminChatBox;