import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Users, Clock } from 'lucide-react';
import { chatService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const HannyChatManager = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [totalUnread, setTotalUnread] = useState(0);
    const messagesEndRef = useRef(null);

    // Solo mostrar para Hanny
    if (user?.username !== 'hannycita10') {
        return null;
    }

    useEffect(() => {
        if (isOpen) {
            loadConversations();
        }
        
        // Verificar nuevas conversaciones cada 15 segundos
        const interval = setInterval(() => {
            if (isOpen) {
                loadConversations();
            } else {
                loadUnreadCount();
            }
        }, 15000);

        return () => clearInterval(interval);
    }, [isOpen]);

    useEffect(() => {
        if (selectedConversation) {
            loadMessages();
        }
    }, [selectedConversation]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadConversations = async () => {
        try {
            const response = await chatService.getConversations();
            setConversations(response.data.conversations);
            
            // Calcular total de no leídos
            const total = response.data.conversations.reduce((sum, conv) => sum + conv.unread_count, 0);
            setTotalUnread(total);
        } catch (error) {
            console.error('Error cargando conversaciones:', error);
        }
    };

    const loadUnreadCount = async () => {
        try {
            const response = await chatService.getConversations();
            const total = response.data.conversations.reduce((sum, conv) => sum + conv.unread_count, 0);
            setTotalUnread(total);
        } catch (error) {
            console.error('Error cargando conteo:', error);
        }
    };

    const loadMessages = async () => {
        if (!selectedConversation) return;
        
        try {
            const response = await chatService.getMessages(selectedConversation.anonymous_user_id);
            setMessages(response.data.messages);
            
            // Recargar conversaciones para actualizar conteo
            await loadConversations();
        } catch (error) {
            console.error('Error cargando mensajes:', error);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedConversation || loading) return;

        setLoading(true);
        try {
            await chatService.sendMessage(selectedConversation.anonymous_user_id, newMessage.trim());
            setNewMessage('');
            await loadMessages();
        } catch (error) {
            console.error('Error enviando mensaje:', error);
            alert('Error al enviar mensaje');
        } finally {
            setLoading(false);
        }
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

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return 'Hoy';
        if (diffDays === 2) return 'Ayer';
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    };

    return (
        <div className="fixed bottom-4 right-20 z-50">
            {/* Botón flotante */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white rounded-full p-3 shadow-lg transition-colors relative"
                >
                    <Users className="h-6 w-6" />
                    {totalUnread > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {totalUnread > 9 ? '9+' : totalUnread}
                        </span>
                    )}
                </button>
            )}

            {/* Ventana de chat manager */}
            {isOpen && (
                <div className="bg-white rounded-lg shadow-xl border w-96 h-96 flex">
                    {/* Lista de conversaciones */}
                    <div className="w-2/5 border-r">
                        {/* Header */}
                        <div className="bg-purple-600 text-white p-3 rounded-tl-lg flex items-center justify-between">
                            <span className="font-medium text-sm">💜 Chats</span>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-purple-200 hover:text-white"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Lista */}
                        <div className="h-80 overflow-y-auto">
                            {conversations.length === 0 ? (
                                <div className="p-4 text-center text-gray-500 text-sm">
                                    <MessageCircle className="h-6 w-6 mx-auto mb-2 text-gray-300" />
                                    <p>No hay conversaciones</p>
                                </div>
                            ) : (
                                conversations.map((conv) => (
                                    <div
                                        key={conv.id}
                                        onClick={() => setSelectedConversation(conv)}
                                        className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                                            selectedConversation?.id === conv.id ? 'bg-purple-50 border-purple-200' : ''
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-medium text-gray-900 truncate">
                                                {conv.anonymous_user_name}
                                            </span>
                                            {conv.unread_count > 0 && (
                                                <span className="bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                                                    {conv.unread_count}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 truncate">
                                            {conv.last_message || 'Sin mensajes'}
                                        </p>
                                        <div className="flex items-center text-xs text-gray-400 mt-1">
                                            <Clock className="h-3 w-3 mr-1" />
                                            {formatDate(conv.last_message_at)}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Chat seleccionado */}
                    <div className="flex-1 flex flex-col">
                        {selectedConversation ? (
                            <>
                                {/* Header del chat */}
                                <div className="bg-purple-600 text-white p-3 rounded-tr-lg">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                        <span className="font-medium text-sm">
                                            {selectedConversation.anonymous_user_name}
                                        </span>
                                    </div>
                                </div>

                                {/* Mensajes */}
                                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                                    {messages.map((message) => (
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
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input de mensaje */}
                                <div className="border-t p-3">
                                    <div className="flex space-x-2">
                                        <textarea
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyPress={handleKeyPress}
                                            placeholder="Escribe tu respuesta..."
                                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                                            rows="1"
                                            disabled={loading}
                                        />
                                        <button
                                            onClick={sendMessage}
                                            disabled={loading || !newMessage.trim()}
                                            className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Send className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-tr-lg">
                                <div className="text-center text-gray-500">
                                    <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                    <p className="text-sm">Selecciona una conversación</p>
                                    <p className="text-xs">para empezar a chatear 💜</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default HannyChatManager;