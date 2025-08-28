// ClickSend credentials for SMS only
const CLICKSEND_API_KEY = '581DA159-7111-2AF5-EFEC-1E97F3574E96';
const CLICKSEND_USERNAME = 'Testing2';

// SignalWire credentials for calls
const SIGNALWIRE_API_KEY = 'PTb7213b222dea360aad70ca3b80790ff244ba352d28f30b41';
const SIGNALWIRE_PROJECT_ID = 'c7b164f0-bc92-490f-aa2c-2e9dbecdb0ff';
const SIGNALWIRE_SPACE_URL = 'gottago.signalwire.com';
const SIGNALWIRE_PHONE_NUMBER = '+18186436090';

const formatPhoneNumber = (phone: string): string => {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Add country code if not present
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  
  return `+${cleaned}`;
};



// Create TwiML for playing audio
const createTwiML = (audioUrl: string): string => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${audioUrl}</Play>
  <Pause length="1"/>
  <Hangup/>
</Response>`;
};

export const scheduleCall = async (to: string, scheduledTime: Date, audioUrl: string): Promise<void> => {
  const formattedTo = formatPhoneNumber(to);
  
  try {
    console.log('🔥 SignalWire: Preparing call with audio:', audioUrl);
    
    // Calculate delay until scheduled time
    const now = new Date();
    const delay = scheduledTime.getTime() - now.getTime();
    
    if (delay <= 0) {
      throw new Error('Scheduled time must be in the future');
    }
    
    console.log(`⏰ Call will be made in ${Math.round(delay / 1000)} seconds`);
    
    // Schedule the call using setTimeout (for immediate execution)
    // In a production app, you'd want to use a proper job queue
    setTimeout(async () => {
      try {
        console.log('📞 Making SignalWire call now...');
        
        // Use TwiML directly in the request
        const twiml = createTwiML(audioUrl);
        
        const response = await fetch(`https://${SIGNALWIRE_SPACE_URL}/api/laml/2010-04-01/Accounts/${SIGNALWIRE_PROJECT_ID}/Calls.json`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`${SIGNALWIRE_PROJECT_ID}:${SIGNALWIRE_API_KEY}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            From: SIGNALWIRE_PHONE_NUMBER,
            To: formattedTo,
            Twiml: twiml,
            Timeout: '30',
            Record: 'false'
          }).toString(),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ SignalWire call failed:', errorText);
          return;
        }

        const result = await response.json();
        console.log('✅ SignalWire call initiated successfully:', result);
        
      } catch (error) {
        console.error('❌ Error making scheduled call:', error);
      }
    }, delay);
    
    console.log('✅ Call scheduled successfully for', scheduledTime.toLocaleString());
    
  } catch (error) {
    console.error('Error scheduling SignalWire call:', error);
    throw error;
  }
};

export const scheduleText = async (to: string, scheduledTime: Date, message: string): Promise<void> => {
  const formattedTo = formatPhoneNumber(to);
  
  try {
    const response = await fetch('https://rest.clicksend.com/v3/sms/send', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${CLICKSEND_USERNAME}:${CLICKSEND_API_KEY}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{
          to: formattedTo,
          body: message,
          schedule: Math.floor(scheduledTime.getTime() / 1000),
          source: 'gotta-go-app'
        }]
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('ClickSend error:', error);
      throw new Error('Failed to schedule text');
    }

    const result = await response.json();
    console.log('Text scheduled successfully:', result);
  } catch (error) {
    console.error('Error scheduling text:', error);
    throw error;
  }
};