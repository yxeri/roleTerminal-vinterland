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

class EventCentral {
  constructor() {
    this.Events = {
      CHATMSG: 'Chat message retrieved',
      ALIAS: 'Aliases changed',
      ACCESS: 'Access level changed',
      MESSAGE: 'Message retrieved',
    };
    this.eventWatchers = {};
  }

  /**
   * Adds a watcher for events
   * @param {Object} watcherParent - Parent to the watcher
   * @param {string} event - Name of the event to listen for
   * @param {Function} func - Function to call
   */
  addWatcher({ watcherParent, event, func }) {
    if (!this.eventWatchers[event]) {
      this.eventWatchers[event] = [];
    }

    this.eventWatchers[event].push({ watcherParent, func });
  }

  /**
   * Remove a watcher
   * @param {Object} watcherParent - Parent to the watcher
   * @param {string} event - Name of the event to listen for
   * @param {Function} func - Function to call
   */
  removeWatcher({ watcherParent, event, func }) {
    if (this.eventWatchers[event]) {
      const index = this.eventWatchers[event].findIndex(watcher => watcher.watcherParent === watcherParent && watcher.func === func);
      this.eventWatchers[event].splice(index, 1);
    }

    console.log(this.eventWatchers[event]);
  }

  triggerEvent({ event, params = {} }) {
    if (this.eventWatchers[event]) {
      this.eventWatchers[event].forEach(watcher => watcher.func(params));
    }
  }
}

const eventCentral = new EventCentral();

module.exports = eventCentral;
