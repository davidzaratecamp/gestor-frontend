import React from 'react';
import { MessageCircle } from 'lucide-react';
import ChatBox from './ChatBox';

const AnonymousChat = () => {
    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
            {/* Icono visual de chat centrado */}
            <div className="text-center">
                <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                    <MessageCircle className="h-12 w-12 text-gray-400" />
                </div>
                
                <h2 className="text-xl font-semibold text-gray-200 mb-2">
                    Chat de Soporte
                </h2>
                
                <p className="text-gray-400 mb-4">
                    Haz clic en el chat para comenzar
                </p>
                
                <div className="w-2 h-2 bg-green-400 rounded-full mx-auto"></div>
                <p className="text-xs text-gray-500 mt-1">En línea</p>
            </div>

            {/* Chat Box */}
            <ChatBox />
        </div>
    );
};

export default AnonymousChat;