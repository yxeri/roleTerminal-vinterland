/*
 Copyright 2016 Aleksandar Jankovic

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

require('../library/polyfills');

const SocketManager = require('../library/SocketManager');
const LoginBox = require('../library/view/templates/LoginBox');
const Messenger = require('../library/view/templates/Messenger');
const Time = require('../library/view/templates/Time');
const OnlineStatus = require('../library/view/templates/OnlineStatus');
const KeyHandler = require('../library/KeyHandler');
const MainMenu = require('../library/view/templates/MainMenu');
const DeviceChecker = require('../library/DeviceChecker');
const storage = require('../library/storage');
const textTools = require('../library/textTools');
const accessRestrictor = require('../library/accessRestrictor');
const aliasUpdater = require('../library/aliasUpdater');

const mainView = document.getElementById('main');
const top = document.getElementById('top');
const onlineStatus = new OnlineStatus(document.getElementById('onlineStatus'));

if (storage.getDeviceId() === null) {
  storage.setDeviceId(textTools.createAlphaNumbericalString(16, false));
}

if (!storage.getUserName()) {
  storage.setAccessLevel(0);
}

window.addEventListener('error', (event) => {
  /**
   * Reloads page
   * @private
   */
  function restart() {
    window.location.reload();
  }

  console.log(event.error);
  // setTimeout(restart, 3000);

  return false;
});

const deviceChecker = new DeviceChecker({ isStandalone: window.navigator.standalone, userAgent: window.navigator.userAgent });
const socketManager = new SocketManager({ socket: io() }); // eslint-disable-line no-undef
const keyHandler = new KeyHandler();
const messenger = new Messenger({ isFullscreen: true, sendButtonText: 'Skicka', isTopDown: false, socketManager, keyHandler });
const topMenu = new MainMenu({ socketManager, keyHandler, parentElement: mainView });

accessRestrictor.addAccessView(messenger);
accessRestrictor.addAccessView(topMenu);
topMenu.appendTo(top);

top.addEventListener('click', () => {
  topMenu.element.classList.toggle('hide');
});

if (deviceChecker.deviceType === deviceChecker.DeviceEnum.IOS) {
  if (!deviceChecker.isLandscape()) {
    top.classList.add('appleMenuFix');
  }

  window.addEventListener('orientationchange', () => {
    if (deviceChecker.isLandscape()) {
      top.classList.remove('appleMenuFix');
    } else {
      top.classList.add('appleMenuFix');
    }
  });
}

const goFullScreen = () => {
  const element = document.documentElement;

  if (element.requestFullscreen) {
    element.requestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
  }
};

keyHandler.addKey(112, goFullScreen);

window.addEventListener('click', () => {
  goFullScreen();
});

socketManager.addEvents([
  {
    event: 'disconnect',
    func: () => {
      onlineStatus.setOffline();
    },
  }, {
    event: 'reconnect',
    func: () => {
      onlineStatus.setOnline();
      socketManager.reconnectDone();
    },
  }, {
    event: 'startup',
    func: ({ yearModification }) => {
      storage.setLocalVal('yearModification', yearModification);

      messenger.toggleAccessElements(storage.getAccessLevel());
      messenger.appendTo(mainView);

      onlineStatus.setOnline();
      new Time(document.getElementById('time')).startClock();

      socketManager.emitEvent('updateId', {
        user: { userName: storage.getUserName() },
        device: { deviceId: storage.getDeviceId() },
      }, ({ error, data = {} }) => {
        if (error) {
          return;
        }

        const userName = storage.getUserName();

        if (userName && data.anonUser) {
          storage.removeUser();
          new LoginBox({
            description: ['Endast för Krismyndigheten och Försvarsmakten'],
            extraDescription: [
              'Din användare kunde inte hittas i databasen',
              'Ni behöver registrera en ny användare',
            ],
            parentElement: mainView,
            socketManager,
            keyHandler,
          }).appendTo(mainView);
        } else if (data.anonUser) {
          new LoginBox({
            description: ['Endast för Krismyndigheten och Försvarsmakten'],
            extraDescription: ['Skriv in ert användarnamn och lösenord'],
            parentElement: mainView,
            socketManager,
            keyHandler,
          }).appendTo(mainView);
        } else {
          aliasUpdater.updateAliasLists(storage.getAliases());
          console.log('I remember you');
        }

        accessRestrictor.toggleAllAccessViews(storage.getAccessLevel());

        socketManager.emitEvent('history', { lines: 10000 }, ({ data: historyData, historyError }) => {
          if (historyError) {
            console.log('history', historyError);

            return;
          }

          messenger.addMessages({ messages: historyData.messages, options: { printable: true }, shouldScroll: true });
        });
      });
    },
  }, {
    event: 'message',
    func: ({ message }) => {
      console.log(message);
    },
  }, {
    event: 'chatMsg',
    func: ({ message }) => {
      messenger.addMessage(message, { printable: true });
    },
  }, {
    event: 'chatMsgs',
    func: ({ messages }) => {
      messenger.addMessages({ options: { printable: true }, messages });
    },
  },
]);

messenger.addMessages({
  messages: [{
    time: new Date(2013, 5, 21, 23, 21, 0),
    text: ['Ryssland har invaderat. Explosioner i Stockholm, Göteborg, Malmö, Köpenhamn. Kommunikationsinfrastrukturen skadad. Totalförsvaret mobiliserat.'],
    userName: 'Centralen',
  }, {
    time: new Date(2013, 5, 22, 0, 2, 0),
    text: ['Kärnvapenexplosioner bekräftade i Stockholm, Göteborg, Malmö, Köpenhamn.'],
    userName: 'Centralen',
  }, {
    time: new Date(2013, 5, 26, 10, 0, 5),
    text: ['Uppsamlingsläger etablerade runt drabbade städer.'],
    userName: 'Centralen',
  }, {
    time: new Date(2014, 3, 14, 0, 0, 0),
    text: ['Tidfunktion trasig i systemet. Har ej tillgång till tekniker. Tappat kontakt med andra centraler.'],
    userName: 'Centralen',
  }, {
    time: new Date(2015, 5, 7, 0, 0, 0),
    text: ['Är någon kvar där ute?'],
    userName: 'Centralen',
  }, {
    time: new Date(2015, 10, 29, 0, 0, 0),
    text: ['Kontakt med uppsamlingslägrena fortfarande bruten. Ingen kontakt med militära styrkor. Ingen kontakt med civila grupper.'],
    userName: 'Centralen',
  }, {
    time: new Date(2016, 0, 5, 0, 0, 0),
    text: ['PRIORITERAT MEDDELANDE', 'Spridning av dödlig sjukdom. Leder till feber, utslag under armarna, hosta. Rekommendation: undvik större grupperingar. Undvik kontakt med personer som uppvisar dessa symptom.'],
    userName: 'Centralen',
  }, {
    time: new Date(2016, 0, 7, 0, 0, 0),
    text: ['Centralen är inte längre säker. Vi kommer att flytta till punkt 72C.'],
    userName: 'Centralen',
  }, {
    time: new Date(2016, 0, 10, 0, 0, 0),
    text: ['omlokaliseringen misslyckades'],
    userName: 'Centralen',
  }, {
    time: new Date(2016, 0, 16, 0, 0, 0),
    text: ['rosen ärröd oh nu är jag ddöd'],
    userName: 'Centralen',
  }, {
    time: new Date(2016, 0, 24, 0, 0, 0),
    text: ['NOTIFIKATION', 'HUVUDCENTRALEN HAR VARIT INAKTIV I 5 DAGAR. DETTA ÄR ETT AUTOMATISERAT MEDDELANDE'],
    userName: 'System',
  }, {
    time: new Date(2016, 10, 14, 0, 0, 0),
    text: ['NOTIFIKATION', 'HUVUDCENTRALEN HAR VARIT INAKTIV I 300 DAGAR. DETTA ÄR ETT AUTOMATISERAT MEDDELANDE. DETTA ÄR ETT SLUTGILTIGT MEDDELANDE. CENTRALEN ÄR INAKTIV'],
    userName: 'System',
  }, {
    time: new Date(2028, 2, 3, 12, 10, 6),
    text: ['Test Test'],
    userName: 'Östbacken',
  }, {
    time: new Date(2028, 2, 3, 12, 10, 7),
    text: ['vi hör er. det fungerar'],
    userName: 'Värnhem',
  }, {
    time: new Date(2028, 2, 3, 12, 10, 8),
    text: ['Vi lyckades!'],
    userName: 'Rifall',
  }, {
    time: new Date(2042, 6, 4, 8, 0, 3),
    text: ['Årtiondets största gräv!', 'Rekordmånga grävarlag har begivit sig av mot trakterna av Ånge, och ryktena är entydiga. En enorm fyndighet av resurser kommer kanske att lokaliseras.'],
    userName: 'Östbacken',
  }, {
    time: new Date(2044, 1, 9, 8, 0, 3),
    text: ['Gula Stjärnan expanderar', 'Matvaror märkta med Gula Stjärnan har börjat säljas även på Hindersmäss. De produceras i Nystad på Öland.'],
    userName: 'Östbacken',
  }, {
    time: new Date(2044, 10, 28, 23, 47, 0),
    text: ['NOTIFIKATION', 'KOMMUNIKATIONSLÄNKEN HAR VARIT INAKTIV I 1 DAGAR. DETTA ÄR ETT AUTOMATISERAT MEDDELANDE'],
    userName: 'System',
  }],
  options: { printable: false },
  shouldScroll: true,
});
