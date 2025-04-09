
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to dashboard
    navigate('/');
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-space-gradient">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Stellar DAO Hub</h1>
        <p className="text-xl text-muted-foreground">Loading governance dashboard...</p>
      </div>
    </div>
  );
};

export default Index;
