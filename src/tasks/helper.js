'use strict';

const RTMTask = require('./task.js');
const genIndex = require('../utils/genIndex.js');

/**
 * API Call: rtm.tasks.getList & update user tasks
 * @param user RTMUser
 * @param callback Callback function(err, tasks)
 * @private
 */
function get(user, callback) {
  user.get('rtm.tasks.getList', function(resp) {
    if ( !resp.isOk ) {
      return callback(resp);
    }

    // List of tasks to return
    let rtn = [];

    // Parse each List
    let lists = resp.tasks.list;
    for ( let i = 0; i < lists.length; i++ ) {
      let list = lists[i];

      // Parse the List's TaskSeries
      if ( list.taskseries ) {
        if ( !Array.isArray(list.taskseries) ) {
          list.taskseries = [list.taskseries];
        }
        for ( let j = 0; j < list.taskseries.length; j++ ) {
          let series = list.taskseries[j];

          // Parse the TaskSeries' Tasks
          if ( !Array.isArray(series.task) ) {
            series.task = [series.task];
          }
          for ( let k = 0; k < series.task.length; k++ ) {
            let task = series.task[k];
            rtn.push(new RTMTask(list.id, series, task));
          }
        }
      }
    }

    // Set Task Indices
    rtn = genIndex(rtn, 'task_id');

    // Set user tasks
    user._tasks = rtn;

    // Return with the callback
    return callback(null, rtn);

  });
}

/**
 * API Call rtm.tasks.add & update user tasks.  Note: this uses RTM's 'smart add'
 * @param {string} name Task Name (or smart add sytanx)
 * @param {{due: *, priority: *, list: *, tags: *, location: *, start: *, repeat: *, estimate: *, to: *, url: *, note: *}} props Additional task properties
 * @param user RTM User
 * @param callback Callback function(err, tasks)
 * @private
 */
function add(name, props, user, callback) {

  // Parse the props keys
  if ( props.due ) {
    name = name + " ^" + props.due;
  }
  if ( props.priority ) {
    name = name + " !" + props.priority
  }
  if ( props.list ) {
    name = name + " #" + props.list;
  }
  if ( props.tags ) {
    if ( !Array.isArray(props.tags) ) {
      props.tags = [props.tags];
    }
    for ( let i = 0; i < props.tags.length; i++ ) {
      name = name + " #" + props.tags[i];
    }
  }
  if ( props.location ) {
    name = name + " @" + props.location;
  }
  if ( props.start ) {
    name = name + " ~" + props.start;
  }
  if ( props.repeat ) {
    name = name + " *" + props.repeat;
  }
  if ( props.estimate ) {
    name = name + " =" + props.estimate;
  }
  if ( props.to ) {
    name = name + " +" + props.to;
  }
  if ( props.url ) {
    name = name + " " + props.url;
  }
  if ( props.note ) {
    name = name + " //" + props.note;
  }

  // Set the request params
  let params = {
    timeline: user.timeline,
    name: name,
    parse: 1
  };

  // Make the API Request
  user.get('rtm.tasks.add', params, function(resp) {
    console.log(resp);

    if ( !resp.isOk ) {
      return callback(resp);
    }

    // Update the User's tasks
    get(user, callback);

  });

}



module.exports = {
  get: get,
  add: add
};