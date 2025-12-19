'use client';
import { X, Bell, Calendar, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  // Initial State with Welcome Message
  const [notifications, setNotifications] = useState([
    { 
      id: 1, 
      title: "स्वागत है! (Welcome)", 
      msg: "सेवादार प्रतापगढ़ - Mission 2029 ऐप में आपका स्वागत है।", 
      date: "Today", 
      read: false 
    },
    { 
      id: 2, 
      title: "पोस्टर बनाएँ", 
      msg: "आज का विशेष पोस्टर बनाने के लिए होम पेज पर जाएँ।", 
      date: "Today", 
      read: true 
    },
  ]);

  const dismiss = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm transition-opacity" 
          onClick={onClose}
        />
      )}

      {/* Slide-over Panel */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-white z-[70] shadow-2xl transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-5 flex flex-col h-full">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h2 className="text-xl font-bold font-hindi flex items-center gap-2">
              <Bell className="text-primary" /> सूचनाएं
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
              <X size={20} />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto space-y-4">
            {notifications.length === 0 ? (
                <div className="text-center text-gray-400 mt-10">
                    कोई नई सूचना नहीं है<br/>(No notifications)
                </div>
            ) : (
                notifications.map((notif) => (
                <div key={notif.id} className={`p-4 rounded-xl border relative group ${notif.read ? 'bg-white border-gray-100' : 'bg-orange-50 border-orange-100'}`}>
                    <h4 className="font-bold text-gray-800 text-sm mb-1">{notif.title}</h4>
                    <p className="text-xs text-gray-600 mb-2">{notif.msg}</p>
                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                    <Calendar size={10} /> {notif.date}
                    </div>
                    
                    {/* Dismiss Button */}
                    <button 
                        onClick={() => dismiss(notif.id)}
                        className="absolute top-2 right-2 text-gray-300 hover:text-red-500 p-1"
                    >
                        <X size={14} />
                    </button>
                </div>
                ))
            )}
          </div>

          {/* Footer */}
          <div className="pt-4 border-t text-center text-xs text-gray-400">
            Mission 2029 Updates
          </div>
        </div>
      </div>
    </>
  );
}