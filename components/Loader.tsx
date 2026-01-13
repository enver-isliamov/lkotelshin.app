
import React from 'react';

const Loader: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-tg-link"></div>
        <p className="text-tg-hint text-lg">Загрузка данных...</p>
      </div>
    </div>
  );
};

export default Loader;
   