import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Minimize2, Maximize2, Bell } from 'lucide-react';
import { chatService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';

const ChatBox = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [adminInfo, setAdminInfo] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [hasNewMessage, setHasNewMessage] = useState(false);
    const messagesEndRef = useRef(null);
    const socketRef = useRef(null);

    // Solo mostrar para usuarios anónimos
    if (user?.role !== 'anonimo') {
        return null;
    }

    useEffect(() => {
        loadAdminInfo();
        loadUnreadCount();
        
        // Configurar WebSocket
        if (user?.id) {
            const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';
            socketRef.current = io(socketUrl);
            
            // Autenticar usuario
            socketRef.current.emit('authenticate', user.id);
            
            // Escuchar nuevos mensajes
            socketRef.current.on('new_message', (data) => {
                console.log('Nuevo mensaje recibido:', data);
                
                // Agregar mensaje a la lista
                setMessages(prev => [...prev, data.message]);
                
                // Si el chat está cerrado, mostrar notificación y abrir automáticamente
                if (!isOpen) {
                    setHasNewMessage(true);
                    setIsOpen(true);
                    setUnreadCount(prev => prev + 1);
                } else {
                    // Si está abierto, marcar como leído inmediatamente
                    markAsRead();
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
    }, [user?.id, isOpen]);

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

    const markAsRead = async () => {
        if (adminInfo && unreadCount > 0) {
            try {
                await chatService.markAsRead(adminInfo.id);
                setUnreadCount(0);
                setHasNewMessage(false);
            } catch (error) {
                console.error('Error marcando como leído:', error);
            }
        }
    };

    const handleOpen = () => {
        setIsOpen(true);
        setIsMinimized(false);
        setHasNewMessage(false);
        if (adminInfo) {
            loadMessages();
            markAsRead();
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
                            <div className="h-64 overflow-y-auto p-3 space-y-2 bg-white">
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