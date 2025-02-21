(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))n(e);new MutationObserver(e=>{for(const r of e)if(r.type==="childList")for(const o of r.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&n(o)}).observe(document,{childList:!0,subtree:!0});function s(e){const r={};return e.integrity&&(r.integrity=e.integrity),e.referrerPolicy&&(r.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?r.credentials="include":e.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function n(e){if(e.ep)return;e.ep=!0;const r=s(e);fetch(e.href,r)}})();const a=[{name:"Babs the Bat",description:"Fly around eating flies for as long as you can, dodging falling sheep, spitting fish, and a rude frog.",credits:["Eric Sartor: Programming, Game Design","Bridget Fae: Art, Sound, Game Design","Ryan Ulch: Music, Sound, Game Design"],path:"/babs/build.html"}];document.body.innerHTML=`
  <h1>Smoking Panda Games</h1>
  <p>Games made by Eric Sartor, with the help and support of some other pretty cool people!!</p>
  <div id="game-list"></div>
`;const d=document.getElementById("game-list");a.forEach(i=>{const t=document.createElement("div");t.style.padding="12px",t.style.margin="12px 0",t.style.border="1px solid black",t.style.borderRadius="6px",t.innerHTML=`
    <h2>${i.name}</h2>
    <main>
      <p>${i.description}</p>
      <p>
        <button class="play">Play</button>
      </p>
      <h3>Credits</h3>
      <p>
        ${i.credits.join("<br>")}
      </p>
    <main>
  `,t.querySelector("button.play").addEventListener("click",()=>{location.assign(i.path)}),d.appendChild(t)});
