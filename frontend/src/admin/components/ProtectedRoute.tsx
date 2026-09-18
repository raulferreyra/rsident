import { Navigate, Outlet } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';

import { auth } from '../../config/firebase';

export default function ProtectedRoute() {
    const [user, loading] = useAuthState(auth);

    if (loading) {
        return null;
    }

    if (!user) {
        return <Navigate to="/admin/login" replace />;
    }

    return <Outlet />;
}