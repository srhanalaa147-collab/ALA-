(function(){
  var DBN='watar-ls-backup',ST='kv',KEY='ls',db=null,timer=null,restoring=false;
  try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist()}catch(e){}
  function open(){return new Promise(function(res,rej){
    if(db)return res(db);
    var r=indexedDB.open(DBN,1);
    r.onupgradeneeded=function(){r.result.createObjectStore(ST)};
    r.onsuccess=function(){db=r.result;res(db)};
    r.onerror=function(){rej(r.error)};
  })}
  function snap(){var o={};try{for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);o[k]=localStorage.getItem(k)}}catch(e){}return o}
  function save(){
    return open().then(function(d){return new Promise(function(res){
      var t=d.transaction(ST,'readwrite');t.objectStore(ST).put(snap(),KEY);t.oncomplete=res;t.onerror=res;
    })}).catch(function(){});
  }
  function later(){if(restoring)return;clearTimeout(timer);timer=setTimeout(save,400)}
  try{
    var P=Storage.prototype,si=P.setItem,ri=P.removeItem,cl=P.clear;
    P.setItem=function(){var r=si.apply(this,arguments);if(this===localStorage)later();return r};
    P.removeItem=function(){var r=ri.apply(this,arguments);if(this===localStorage)later();return r};
    P.clear=function(){var r=cl.apply(this,arguments);if(this===localStorage)later();return r};
  }catch(e){}
  function restore(){
    var empty=false;try{empty=localStorage.length===0}catch(e){return}
    if(!empty){save();return}
    open().then(function(d){return new Promise(function(res){
      var q=d.transaction(ST).objectStore(ST).get(KEY);
      q.onsuccess=function(){res(q.result)};q.onerror=function(){res(null)};
    })}).then(function(o){
      if(!o||!Object.keys(o).length)return;
      restoring=true;
      try{Object.keys(o).forEach(function(k){localStorage.setItem(k,o[k])})}catch(e){}
      restoring=false;
      try{if(!sessionStorage.getItem('watar-restored')){sessionStorage.setItem('watar-restored','1');location.reload()}}catch(e){}
    }).catch(function(){});
  }
  restore();
  addEventListener('pagehide',save);
  document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')save()});
  setInterval(save,15000);
})();
