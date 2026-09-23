/* Site-wide policy, including videos inserted after the initial page load.
   Published portfolio files are also remuxed without an audio track. */
(() => {
  function silence(video){
    if(!(video instanceof HTMLVideoElement))return;
    if(!video.defaultMuted)video.defaultMuted=true;
    if(!video.muted)video.muted=true;
    if(video.volume!==0)video.volume=0;
    if(video.controls)video.controls=false;
    video.disablePictureInPicture=true;
    video.disableRemotePlayback=true;
  }
  function scan(node){
    if(node.nodeType!==1)return;
    silence(node);
    node.querySelectorAll('video').forEach(silence);
  }
  ['play','playing','volumechange','loadstart','loadedmetadata'].forEach(type=>document.addEventListener(type,event=>silence(event.target),true));
  document.addEventListener('contextmenu',event=>{if(event.target.closest('video,.video-expand'))event.preventDefault()});
  new MutationObserver(records=>records.forEach(record=>{
    if(record.type==='attributes')silence(record.target);
    else record.addedNodes.forEach(scan);
  })).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['controls','muted','src']});
  document.querySelectorAll('video').forEach(silence);
})();
