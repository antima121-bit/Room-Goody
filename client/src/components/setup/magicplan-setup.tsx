import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Smartphone, 
  Download, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  Zap,
  Shield,
  Clock
} from "lucide-react";

interface MagicPlanSetupProps {
  onSetupComplete: () => void;
  onSkip: () => void;
}

export default function MagicPlanSetup({ onSetupComplete, onSkip }: MagicPlanSetupProps) {
  const [setupStep, setSetupStep] = useState<'intro' | 'install' | 'login' | 'verify' | 'complete'>('intro');
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if setup was already completed
    if (localStorage.getItem('magicplan_setup_complete')) {
      onSetupComplete();
    }
  }, [onSetupComplete]);

  const handleStartSetup = () => {
    setSetupStep('install');
  };

  const handleAppInstallCheck = () => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Try to open MagicPlan to check if installed
      const testUrl = 'magicplan://';
      window.location.href = testUrl;
      
      // Give time for app to open
      setTimeout(() => {
        if (document.hidden) {
          // App opened successfully
          setIsAppInstalled(true);
          setSetupStep('login');
          toast({
            title: "MagicPlan Detected",
            description: "Great! The app is installed. Now let's sign you in.",
          });
        } else {
          // App not installed - redirect to store
          toast({
            title: "App Not Found",
            description: "Redirecting to app store to install MagicPlan...",
          });
          
          const storeUrl = navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')
            ? 'https://apps.apple.com/app/magicplan/id427424432'
            : 'https://play.google.com/store/apps/details?id=com.sensopia.magicplan';
          
          window.open(storeUrl, '_blank');
        }
      }, 1500);
    } else {
      // Desktop - assume web access
      setIsAppInstalled(true);
      setSetupStep('login');
    }
  };

  const handleLogin = () => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Open MagicPlan for login
      window.location.href = 'magicplan://';
      
      setSetupStep('verify');
      
      toast({
        title: "Sign In to MagicPlan",
        description: "Please sign in using your MagicPlan account. Return here when done.",
      });
    } else {
      // Desktop web login
      window.open('https://my.magicplan.app/login', '_blank');
      setSetupStep('verify');
      
      toast({
        title: "Web Login Opened",
        description: "Sign in to MagicPlan in the new tab, then return here.",
      });
    }
  };

  const handleVerifySetup = () => {
    // Mark setup as complete
    localStorage.setItem('magicplan_setup_complete', 'true');
    localStorage.setItem('magicplan_setup_date', new Date().toISOString());
    
    setSetupStep('complete');
    
    toast({
      title: "Setup Complete!",
      description: "MagicPlan is now ready for seamless room scanning.",
    });
    
    setTimeout(() => {
      onSetupComplete();
    }, 2000);
  };

  const handleSkipSetup = () => {
    localStorage.setItem('magicplan_setup_skipped', 'true');
    onSkip();
  };

  if (setupStep === 'intro') {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-xl">One-Time MagicPlan Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-3">
            <p className="text-muted-foreground">
              To enable professional room scanning, we need to set up MagicPlan once.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-green-800">
                <Shield className="w-4 h-4" />
                <span className="font-medium">You won't be asked again!</span>
              </div>
              <p className="text-green-700 text-sm mt-1">
                After this one-time setup, room scanning will be seamless.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Professional floor plan accuracy</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Automatic room measurements</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Integration with object detection</span>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button onClick={handleStartSetup} className="flex-1">
              <Smartphone className="w-4 h-4 mr-2" />
              Start Setup
            </Button>
            <Button onClick={handleSkipSetup} variant="outline" className="flex-1">
              Skip for Now
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (setupStep === 'install') {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Download className="w-8 h-8 text-orange-600" />
          </div>
          <CardTitle>Install MagicPlan App</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-center">
            We need to check if MagicPlan is installed on your device.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">What happens next:</p>
                <ul className="text-blue-800 text-sm mt-1 space-y-1">
                  <li>• We'll try to open MagicPlan</li>
                  <li>• If not installed, we'll redirect to app store</li>
                  <li>• Install and return to continue setup</li>
                </ul>
              </div>
            </div>
          </div>

          <Button onClick={handleAppInstallCheck} className="w-full">
            <ExternalLink className="w-4 h-4 mr-2" />
            Check MagicPlan Installation
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (setupStep === 'login') {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle>Sign In to MagicPlan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-center">
            Now we'll open MagicPlan for you to sign in with your account.
          </p>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900">Important:</p>
                <p className="text-amber-800 text-sm mt-1">
                  Don't log out of MagicPlan after signing in. This maintains your session for future scans.
                </p>
              </div>
            </div>
          </div>

          <Button onClick={handleLogin} className="w-full">
            <ExternalLink className="w-4 h-4 mr-2" />
            Open MagicPlan to Sign In
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (setupStep === 'verify') {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-blue-600 animate-pulse" />
          </div>
          <CardTitle>Waiting for Sign In</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-center">
            Please complete sign in to MagicPlan, then return here to finish setup.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm text-center">
              Already signed in? Click the button below to complete setup.
            </p>
          </div>

          <div className="flex space-x-3">
            <Button onClick={handleVerifySetup} className="flex-1">
              <CheckCircle className="w-4 h-4 mr-2" />
              I'm Signed In
            </Button>
            <Button onClick={handleSkipSetup} variant="outline" className="flex-1">
              Skip Setup
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (setupStep === 'complete') {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-green-900">Setup Complete!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              MagicPlan is now configured for seamless room scanning.
            </p>
            
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              Ready for Professional Scanning
            </Badge>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 text-sm text-center">
              Future room scans will launch directly without any login prompts!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}