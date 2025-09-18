import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Minimize2, Maximize2 } from 'lucide-react';
import { chatService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ChatBox = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [adminInfo, setAdminInfo] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const messagesEndRef = useRef(null);

    // Solo mostrar para usuarios anónimos
    if (user?.role !== 'anonimo') {
        return null;
    }

    useEffect(() => {
        loadAdminInfo();
        loadUnreadCount();
        
        // Verificar mensajes no leídos cada 10 segundos
        const interval = setInterval(() => {
            if (adminInfo) {
                loadMessages();
                loadUnreadCount();
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [adminInfo]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadAdminInfo = async () => {
        try {
            const response = await chatService.getAdminInfo();
            setAdminInfo(response.data.admin);
        } catch (error) {
            console.error('Error cargando info del admin:', error);
        }
    };

    const loadMessages = async () => {
        if (!adminInfo) return;
        
        try {
            const response = await chatService.getMessages(adminInfo.id);
            setMessages(response.data.messages);
        } catch (error) {
            console.error('Error cargando mensajes:', error);
        }
    };

    const loadUnreadCount = async () => {
        try {
            const response = await chatService.getUnreadCount();
            setUnreadCount(response.data.unread_count);
        } catch (error) {
            console.error('Error cargando conteo no leídos:', error);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !adminInfo || loading) return;

        setLoading(true);
        try {
            await chatService.sendMessage(adminInfo.id, newMessage.trim());
            setNewMessage('');
            await loadMessages();
            await loadUnreadCount();
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

    const handleOpen = () => {
        setIsOpen(true);
        setIsMinimized(false);
        if (adminInfo) {
            loadMessages();
            loadUnreadCount();
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
        <div className="fixed bottom-4 right-4 z-50">
            {/* Botón flotante */}
            {!isOpen && (
                <button
                    onClick={handleOpen}
                    className="bg-purple-600 hover:bg-purple-700 text-white rounded-full p-3 shadow-lg transition-colors relative"
                >
                    <MessageCircle className="h-6 w-6" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
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
                                Chat con {adminInfo?.full_name || 'Administrador'}
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
                            <div className="h-64 overflow-y-auto p-3 space-y-2">
                                {messages.length === 0 ? (
                                    <div className="text-center text-gray-500 text-sm mt-8">
                                        <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                        <p>¡Hola! Puedes escribir aquí para comunicarte con el administrador.</p>
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
                                    <textarea
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Escribe tu mensaje..."
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
                    )}
                </div>
            )}
        </div>
    );
};

export default ChatBox;