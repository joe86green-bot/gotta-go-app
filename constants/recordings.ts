export interface Recording {
  id: number;
  title: string;
  description: string;
  url: string;
}

export interface ScheduledItem {
  id: string;
  type: 'call' | 'text';
  phoneNumber: string;
  scheduledTime: Date;
  message?: string;
  recordingId?: number;
  recordingTitle?: string;
  retryCount?: number;
  maxRetries?: number;
  status: 'pending' | 'sent' | 'failed';
}

export const RECORDINGS: Recording[] = [
  {
    id: 1,
    title: 'Your Friend Is In the Hospital',
    description: 'Male voice',
    url: 'https://kev.ing/mp3/1.mp3',
  },
  {
    id: 2,
    title: 'Where Are You',
    description: 'Male voice',
    url: 'https://kev.ing/mp3/2.mp3',
  },
  {
    id: 3,
    title: 'Pick Me Up Please',
    description: 'Male voice',
    url: 'https://kev.ing/mp3/3.mp3',
  },
  {
    id: 4,
    title: 'I Need Your Help',
    description: 'Male voice',
    url: 'https://kev.ing/mp3/4.mp3',
  },
  {
    id: 5,
    title: 'Get Home Now',
    description: 'Male voice',
    url: 'https://kev.ing/mp3/5.mp3',
  },
  {
    id: 6,
    title: 'Your Friend Is In the Hospital',
    description: 'Female voice',
    url: 'https://kev.ing/mp3/6.mp3',
  },
  {
    id: 7,
    title: 'Where Are You',
    description: 'Female voice',
    url: 'https://kev.ing/mp3/7.mp3',
  },
  {
    id: 8,
    title: 'Pick Me Up Please',
    description: 'Female voice',
    url: 'https://kev.ing/mp3/8.mp3',
  },
  {
    id: 9,
    title: 'I Need Your Help',
    description: 'Female voice',
    url: 'https://kev.ing/mp3/9.mp3',
  },
  {
    id: 10,
    title: 'Get Home Now',
    description: 'Female voice',
    url: 'https://kev.ing/mp3/10.mp3',
  },
];