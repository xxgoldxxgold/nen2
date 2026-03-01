(function(){
  'use strict';
  if(navigator.doNotTrack==='1')return;
  var d=document,w=window,s=sessionStorage;
  var uid=d.currentScript&&d.currentScript.dataset.uid;
  var pid=d.currentScript&&d.currentScript.dataset.pid;
  if(!uid)return;

  var sid=s.getItem('_n2s');
  if(!sid){sid='s_'+Math.random().toString(36).slice(2)+Date.now().toString(36);s.setItem('_n2s',sid);}

  var dt=w.innerWidth<768?'mobile':w.innerWidth<1024?'tablet':'desktop';
  var ref=d.referrer&&!d.referrer.includes(location.hostname)?d.referrer:'';
  var q=[];var sent={};var t0=Date.now();

  function send(evts,beacon){
    if(!evts.length)return;
    var body=JSON.stringify({events:evts});
    if(beacon&&navigator.sendBeacon){
      navigator.sendBeacon('/api/analytics/events',new Blob([body],{type:'application/json'}));
    }else{
      fetch('/api/analytics/events',{method:'POST',headers:{'Content-Type':'application/json'},body:body,keepalive:true}).catch(function(){});
    }
  }

  function ev(type,extra){
    var e={user_id:uid,event_type:type,session_id:sid,device_type:dt,referrer:ref,page_path:location.pathname};
    if(pid)e.post_id=pid;
    if(extra)for(var k in extra)e[k]=extra[k];
    return e;
  }

  // Pageview
  send([ev('pageview')]);

  // Scroll tracking
  if(pid){
    var marks={25:false,50:false,75:false,100:false};
    var onScroll=function(){
      var h=d.documentElement.scrollHeight-w.innerHeight;
      if(h<=0)return;
      var p=Math.round(w.scrollY/h*100);
      [25,50,75,100].forEach(function(m){
        if(p>=m&&!marks[m]&&!sent['s'+m]){
          marks[m]=true;sent['s'+m]=true;
          q.push(ev('scroll_'+m));
        }
      });
      if(q.length>=3){send(q);q=[];}
    };
    w.addEventListener('scroll',onScroll,{passive:true});
  }

  // Exit / duration
  var onExit=function(){
    var dur=Math.round((Date.now()-t0)/1000);
    q.push(ev('exit',{duration_seconds:dur}));
    // Read complete: scrolled 100% and spent enough time
    if(sent['s100']&&dur>=30&&!sent['rc']){
      sent['rc']=true;
      q.push(ev('read_complete',{duration_seconds:dur}));
    }
    send(q,true);q=[];
  };
  d.addEventListener('visibilitychange',function(){if(d.visibilityState==='hidden')onExit();});
  w.addEventListener('pagehide',onExit);
})();
