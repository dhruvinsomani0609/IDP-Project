import { motion } from 'framer-motion';
import { LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { DocumentUpload } from './DocumentUpload';

export const Dashboard: React.FC = () => {
    const { user, signOut } = useAuth();

    const handleSignOut = async () => {
        await signOut();
    };

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header with User Info */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/10 backdrop-blur-sm border-b border-white/20"
            >
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                            <UserIcon className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-white font-medium">
                                {user?.user_metadata?.full_name || 'User'}
                            </p>
                            <p className="text-white/70 text-sm">{user?.email}</p>
                        </div>
                    </div>

                    <button
                        onClick={handleSignOut}
                        className="
              flex items-center gap-2 px-4 py-2
              bg-white/20 hover:bg-white/30
              text-white rounded-lg
              transition-all duration-200
              border border-white/30
              focus:outline-none focus:ring-2 focus:ring-white/50
            "
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            </motion.header>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="w-full">
                    <div className="text-center mb-8">
                        <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
                            Document Upload Module
                        </h1>
                        <p className="text-xl text-white/90 drop-shadow">
                            Upload and manage your documents securely
                        </p>
                    </div>

                    <DocumentUpload />
                </div>
            </div>
        </div>
    );
};
