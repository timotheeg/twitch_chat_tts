import speak from './voiceover.js'

import config from './config.json' assert { type: "json" };

import { RefreshingAuthProvider } from '@twurple/auth';
import { ChatClient } from '@twurple/chat'

function is_spam(msg) {
  if (/bigfollows\s*.\s*com/i.test(msg)) return true;

  return (
    /become famous/i.test(msg)
    &&
    /buy/i.test(msg)
  );
}

async function twitch() {
  const authProvider = new RefreshingAuthProvider(
      {
        clientId: config.twitch.client.id,
        clientSecret: config.twitch.client.secret
      }
  );

  const tokenData = {
    accessToken: config.twitch.access.accessToken,
    refreshToken: config.twitch.access.refreshToken,
    expiresIn: 0,
    obtainmentTimestamp: 0,
  }

  authProvider.onRefresh(async (userId, newTokenData) => {
    console.log('Token refresh', userId, newTokenData)
    config.twitch.acces = newTokenData;
    // config.save();
  });

  await authProvider.addUserForToken(tokenData, ['chat']);

  console.log('TWITCH: connecting to ', config.twitch.channels);

  const chatClient = new ChatClient({ authProvider, channels: config.twitch.channels });

  chatClient.onMessage((channel, user, message) => {
    console.log('TWITCH', user, message);

    // comes from sample client, but I might as well leave it for fun :)
    if (message === '!ping') {
      chatClient.say(channel, 'Pong!');
    }
    else if (message === '!dice') {
      const diceRoll = Math.floor(Math.random() * 6) + 1;
      chatClient.say(channel, `@${user} rolled a ${diceRoll}`)
    }

    if (is_spam(message)) {
      // Bot.ban(user, 'spam'); // TODO: find API to do that
      return;
    }

    // compatibility format with previous version
    const chatter = {
      user:         user,
      username:     user,
      display_name: user,
      message:      message || ''
    }

    speak(chatter);
  });

  chatClient.onSub((channel, user) => {
    const chatter = {
      user:         'yobi9',
      username:     'yobi9',
      display_name: 'yobi9',
      message:      `Thanks to ${user} for subscribing to the channel!`
    };

    speak(chatter);
  });

  chatClient.onResub((channel, user, subInfo) => {
    const chatter = {
      user:         'yobi9',
      username:     'yobi9',
      display_name: 'yobi9',
      message:      `Thanks to ${user} for subscribing to the channel for a total of ${subInfo.months} months!`
    };

    speak(chatter);
  });

  chatClient.onSubGift((channel, user, subInfo) => {
    const chatter = {
      user:         'yobi9',
      username:     'yobi9',
      display_name: 'yobi9',
      message:      `Thanks to ${subInfo.gifter} for gifting a subscription to ${user}!`
    };

    speak(chatter);
  });

  chatClient.onRaid((channel, user, raidInfo) => {
    const chatter = {
      user:         'yobi9',
      username:     'yobi9',
      display_name: raidInfo.displayName,
      message:      `Woohoo! ${raidInfo.displayName} is raiding with a party of ${raidInfo.viewerCount}. Thanks for the raid ${raidInfo.displayName}!`
    };

    speak(chatter);
  });

  await chatClient.connect();

  console.log('TWITCH: chatClient connected');
}

twitch();