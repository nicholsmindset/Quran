'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Share2, 
  Download, 
  Copy, 
  Trophy, 
  Flame, 
  Star,
  Camera,
  Facebook,
  Twitter,
  Instagram,
  MessageCircle,
  Mail,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProgressSharingProps {
  score?: number;
  streak?: number;
  achievement?: string;
  trigger?: React.ReactNode;
}

export function ProgressSharing({ 
  score, 
  streak, 
  achievement, 
  trigger 
}: ProgressSharingProps) {
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  const shareData = {
    score,
    streak,
    achievement,
    message: generateShareMessage({ score, streak, achievement })
  };

  const handleShare = async (platform: string) => {
    setSelectedPlatform(platform);
    
    try {
      switch (platform) {
        case 'native':
          if (navigator.share) {
            await navigator.share({
              title: 'My Qur\'an Learning Progress',
              text: shareData.message,
              url: window.location.origin
            });
          }
          break;
          
        case 'copy':
          await navigator.clipboard.writeText(shareData.message);
          toast({
            title: 'Copied to clipboard',
            description: 'Share message copied successfully!'
          });
          break;
          
        case 'twitter':
          const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.message)}&url=${encodeURIComponent(window.location.origin)}`;
          window.open(twitterUrl, '_blank', 'width=600,height=400');
          break;
          
        case 'facebook':
          const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin)}&quote=${encodeURIComponent(shareData.message)}`;
          window.open(fbUrl, '_blank', 'width=600,height=400');
          break;
          
        case 'whatsapp':
          const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareData.message + ' ' + window.location.origin)}`;
          window.open(whatsappUrl, '_blank');
          break;
          
        case 'email':
          const emailUrl = `mailto:?subject=My Qur'an Learning Progress&body=${encodeURIComponent(shareData.message + '\n\n' + window.location.origin)}`;
          window.open(emailUrl);
          break;
      }
      
      // Close modal after sharing
      setTimeout(() => {
        setShowModal(false);
        setSelectedPlatform(null);
      }, 1000);
      
    } catch (error) {
      toast({
        title: 'Share failed',
        description: 'Unable to share at this time. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleDownloadCertificate = async () => {
    try {
      // Generate certificate image (would integrate with a certificate service)
      const certificateData = {
        score: shareData.score,
        streak: shareData.streak,
        achievement: shareData.achievement,
        date: new Date().toLocaleDateString(),
        name: 'Student' // Would use actual user name
      };
      
      // This would normally call an API to generate the certificate
      const response = await fetch('/api/certificates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(certificateData)
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quran-progress-certificate-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
        
        toast({
          title: 'Certificate downloaded',
          description: 'Your achievement certificate has been saved!'
        });
      }
    } catch (error) {
      toast({
        title: 'Download failed',
        description: 'Unable to generate certificate. Please try again.',
        variant: 'destructive'
      });
    }
  };

  return (
    <>
      {/* Trigger Button */}
      {trigger ? (
        <div onClick={() => setShowModal(true)}>
          {trigger}
        </div>
      ) : (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowModal(true)}
          className="group"
        >
          <Share2 className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
          Share Progress
        </Button>
      )}

      {/* Share Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md"
            >
              <Card className="shadow-2xl border-0">
                <CardHeader className="text-center pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <Share2 className="h-5 w-5 text-emerald-600" />
                      <span>Share Your Progress</span>
                    </CardTitle>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowModal(false)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Progress Preview */}
                  <div className="mt-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
                    <div className="text-center space-y-2">
                      <div className="flex items-center justify-center space-x-4">
                        {shareData.score && (
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <Badge variant="success">{shareData.score}%</Badge>
                          </div>
                        )}
                        
                        {shareData.streak && (
                          <div className="flex items-center space-x-1">
                            <Flame className="h-4 w-4 text-orange-500" />
                            <Badge variant="secondary">{shareData.streak} days</Badge>
                          </div>
                        )}
                        
                        {shareData.achievement && (
                          <div className="flex items-center space-x-1">
                            <Trophy className="h-4 w-4 text-yellow-600" />
                            <Badge variant="outline" className="text-xs">Achievement</Badge>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        Alhamdulillah for this progress in Qur'an learning! 🌟
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {/* Share Message Preview */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Share Message:</label>
                      <div className="p-3 bg-muted/50 rounded-lg text-sm">
                        {shareData.message}
                      </div>
                    </div>
                    
                    {/* Platform Buttons */}
                    <div>
                      <label className="text-sm font-medium mb-3 block">Choose Platform:</label>
                      <div className="grid grid-cols-2 gap-2">
                        {/* Native Share (if available) */}
                        {navigator.share && (
                          <ShareButton
                            icon={Share2}
                            label="Share"
                            onClick={() => handleShare('native')}
                            isSelected={selectedPlatform === 'native'}
                            color="bg-blue-500 text-white"
                          />
                        )}
                        
                        <ShareButton
                          icon={Copy}
                          label="Copy"
                          onClick={() => handleShare('copy')}
                          isSelected={selectedPlatform === 'copy'}
                          color="bg-gray-500 text-white"
                        />
                        
                        <ShareButton
                          icon={MessageCircle}
                          label="WhatsApp"
                          onClick={() => handleShare('whatsapp')}
                          isSelected={selectedPlatform === 'whatsapp'}
                          color="bg-green-500 text-white"
                        />
                        
                        <ShareButton
                          icon={Twitter}
                          label="Twitter"
                          onClick={() => handleShare('twitter')}
                          isSelected={selectedPlatform === 'twitter'}
                          color="bg-blue-400 text-white"
                        />
                        
                        <ShareButton
                          icon={Facebook}
                          label="Facebook"
                          onClick={() => handleShare('facebook')}
                          isSelected={selectedPlatform === 'facebook'}
                          color="bg-blue-600 text-white"
                        />
                        
                        <ShareButton
                          icon={Mail}
                          label="Email"
                          onClick={() => handleShare('email')}
                          isSelected={selectedPlatform === 'email'}
                          color="bg-red-500 text-white"
                        />
                      </div>
                    </div>
                    
                    {/* Certificate Download */}
                    <div className="pt-4 border-t">
                      <Button
                        onClick={handleDownloadCertificate}
                        variant="islamic"
                        className="w-full group"
                      >
                        <Download className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                        Download Achievement Certificate
                      </Button>
                    </div>
                    
                    {/* Islamic Message */}
                    <div className="text-center p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <div className="arabic-text text-lg text-emerald-800 mb-1">
                        وَمَن يَشْكُرُ فَإِنَّمَا يَشْكُرُ لِنَفْسِهِ
                      </div>
                      <div className="text-xs text-emerald-700 italic">
                        "And whoever is grateful - he is grateful for [the benefit of] himself"
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        - Quran 31:12
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ShareButton({ 
  icon: Icon, 
  label, 
  onClick, 
  isSelected, 
  color 
}: {
  icon: any;
  label: string;
  onClick: () => void;
  isSelected: boolean;
  color: string;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`flex flex-col items-center p-3 rounded-lg transition-all ${
        isSelected 
          ? `${color} shadow-lg` 
          : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
      }`}
    >
      <Icon className="h-5 w-5 mb-1" />
      <span className="text-xs font-medium">{label}</span>
    </motion.button>
  );
}

function generateShareMessage({ 
  score, 
  streak, 
  achievement 
}: { 
  score?: number; 
  streak?: number; 
  achievement?: string;
}): string {
  let message = "Alhamdulillah! 🌟 ";
  
  if (achievement) {
    message += `I just unlocked "${achievement}" in my Qur'an learning journey! `;
  } else {
    message += "Made progress in my Qur'an learning journey! ";
  }
  
  const achievements = [];
  
  if (score) {
    achievements.push(`${score}% accuracy on today's quiz`);
  }
  
  if (streak) {
    achievements.push(`${streak} day learning streak`);
  }
  
  if (achievements.length > 0) {
    message += achievements.join(" and ") + ". ";
  }
  
  message += "Join me in studying the Noble Qur'an! 📚✨ #QuranLearning #IslamicEducation #Alhamdulillah";
  
  return message;
}