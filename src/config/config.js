export const config = {
  token: process.env.token,
  prefix: '.',
  ownerIds: ['931059762173464597', '937380760875302974', '1052620216443601076', '958583892326117437','785708354445508649'],





  database: {
    guild: './database/guild.db',
    user: './database/user.db',
    premium: './database/premium.db',
    
  },

  status: {
    text: '!help | Discord Bot',
    status: 'dnd'
  },

  colors: {
    info: '#3498db',
    success: '#2ecc71',
    warning: '#f39c12',
    error: '#e74c3c'
  },

  watermark: 'coded by bre4d'
};