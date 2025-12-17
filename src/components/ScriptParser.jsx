import React, { useState } from 'react';
import axios from 'axios';
import { 
    FileText, 
    Send, 
    CheckCircle, 
    XCircle, 
    Eye,
    AlertCircle,
    Copy,
    Trash2
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

const ScriptParser = () => {
    const [scriptText, setScriptText] = useState('');
    const [equipmentId, setEquipmentId] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [mode, setMode] = useState('preview'); // 'preview' o 'create'

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!scriptText.trim()) {
            setError('Por favor, pega el contenido del script');
            return;
        }
        
        if (!equipmentId.trim()) {
            setError('Por favor, ingresa el consecutivo del equipo');
            return;
        }

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const response = await axios.post(`${API_BASE_URL}/script-parser/parse`, {
                scriptText: scriptText,
                mode: mode,
                equipmentId: equipmentId
            });

            setResult(response.data);
            
            if (mode === 'create' && response.data.success) {
                // Limpiar formulario después de crear exitosamente
                setScriptText('');
                setEquipmentId('');
            }

        } catch (error) {
            console.error('Error al procesar script:', error);
            setError(error.response?.data?.message || 'Error al procesar el script');
        } finally {
            setLoading(false);
        }
    };

    const clearForm = () => {
        setScriptText('');
        setEquipmentId('');
        setResult(null);
        setError('');
    };

    const copyResultToClipboard = () => {
        if (result) {
            navigator.clipboard.writeText(JSON.stringify(result, null, 2));
            alert('Resultado copiado al portapapeles');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <div className="flex items-center">
                        <FileText className="h-8 w-8 text-indigo-600 mr-3" />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Crear Activo desde Script</h1>
                            <p className="text-sm text-gray-600">
                                Pega el output completo del script de resumen del equipo y se creará automáticamente el activo
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto p-6">

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Formulario */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <form onSubmit={handleSubmit}>
                        {/* Consecutivo del Equipo */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <FileText className="inline h-4 w-4 mr-1" />
                                Consecutivo del Equipo *
                            </label>
                            <input
                                type="text"
                                value={equipmentId}
                                onChange={(e) => setEquipmentId(e.target.value)}
                                placeholder="ECC-CPU-00119"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Ejemplo: ECC-CPU-00119, ECC'CPU'00120, etc.
                            </p>
                        </div>

                        {/* Contenido del Script */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Contenido del Script *
                            </label>
                            <textarea
                                value={scriptText}
                                onChange={(e) => setScriptText(e.target.value)}
                                placeholder="Pega aquí todo el output del script de resumen del equipo..."
                                rows={15}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Pega todo el texto que comienza con "RESUMEN DEL EQUIPO" hasta "FIN DEL RESUMEN"
                            </p>
                        </div>

                        {/* Modo */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Modo</label>
                            <div className="flex space-x-4">
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        value="preview"
                                        checked={mode === 'preview'}
                                        onChange={(e) => setMode(e.target.value)}
                                        className="mr-2"
                                    />
                                    <Eye className="h-4 w-4 mr-1" />
                                    Preview (solo ver)
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        value="create"
                                        checked={mode === 'create'}
                                        onChange={(e) => setMode(e.target.value)}
                                        className="mr-2"
                                    />
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Crear Activo
                                </label>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <div className="flex">
                                    <XCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                                    <span className="text-red-700 text-sm">{error}</span>
                                </div>
                            </div>
                        )}

                        {/* Botones */}
                        <div className="flex space-x-3">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg font-medium ${
                                    mode === 'create'
                                        ? 'bg-green-600 hover:bg-green-700 text-white'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Procesando...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-4 w-4 mr-2" />
                                        {mode === 'create' ? 'Crear Activo' : 'Vista Previa'}
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={clearForm}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Limpiar
                            </button>
                        </div>
                    </form>
                </div>

                {/* Resultado */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900">Resultado</h3>
                        {result && (
                            <button
                                onClick={copyResultToClipboard}
                                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                            >
                                <Copy className="h-4 w-4 mr-1" />
                                Copiar
                            </button>
                        )}
                    </div>

                    {!result ? (
                        <div className="text-center py-12">
                            <FileText className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="mt-2 text-sm text-gray-500">
                                El resultado aparecerá aquí después de procesar el script
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Estado */}
                            <div className={`p-3 rounded-lg flex items-center ${
                                result.success 
                                    ? 'bg-green-50 border border-green-200' 
                                    : 'bg-red-50 border border-red-200'
                            }`}>
                                {result.success ? (
                                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                                ) : (
                                    <XCircle className="h-5 w-5 text-red-500 mr-2" />
                                )}
                                <span className={`font-medium ${
                                    result.success ? 'text-green-800' : 'text-red-800'
                                }`}>
                                    {result.message}
                                </span>
                            </div>

                            {/* Datos extraídos */}
                            {result.success && result.datos_extraidos && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Datos Extraídos:</h4>
                                    <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1">
                                        <div><strong>Placa:</strong> {result.datos_extraidos.numero_placa}</div>
                                        <div><strong>Marca/Modelo:</strong> {result.datos_extraidos.marca_modelo}</div>
                                        <div><strong>Serie:</strong> {result.datos_extraidos.numero_serie_fabricante}</div>
                                        <div><strong>CPU:</strong> {result.datos_extraidos.cpu_procesador}</div>
                                        <div><strong>RAM:</strong> {result.datos_extraidos.memoria_ram}</div>
                                        <div><strong>Disco:</strong> {result.datos_extraidos.almacenamiento}</div>
                                        <div><strong>SO:</strong> {result.datos_extraidos.sistema_operativo}</div>
                                    </div>
                                </div>
                            )}

                            {/* Activo creado */}
                            {result.success && result.activo && (
                                <div>
                                    <h4 className="font-medium text-green-800 mb-2">🎉 Activo Creado Exitosamente:</h4>
                                    <div className="bg-green-50 p-3 rounded-lg text-sm">
                                        <div><strong>ID del Activo:</strong> {result.activo.id}</div>
                                        <div><strong>Número de Placa:</strong> {result.activo.numero_placa}</div>
                                        <div><strong>Valor:</strong> ${new Intl.NumberFormat('es-CO').format(result.activo.valor)}</div>
                                    </div>
                                </div>
                            )}

                            {/* JSON completo (colapsible) */}
                            <details className="border border-gray-200 rounded-lg">
                                <summary className="px-3 py-2 cursor-pointer text-sm font-medium text-gray-700 hover:bg-gray-50">
                                    Ver JSON Completo
                                </summary>
                                <pre className="p-3 bg-gray-900 text-green-400 text-xs overflow-auto max-h-64">
                                    {JSON.stringify(result, null, 2)}
                                </pre>
                            </details>
                        </div>
                    )}
                </div>
            </div>
            </div>
        </div>
    );
};

export default ScriptParser;