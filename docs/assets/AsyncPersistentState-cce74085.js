import{S as l,j as e,__tla as x}from"./index-f48ba628.js";let c,u=Promise.all([(()=>{try{return x}catch{}})()]).then(async()=>{let t,i;t="https://random-data-api.com/api/users/random_user?size=3",i=l.createAsyncPersistent("persistent-api-call",()=>fetch(t).then(n=>n.json())),c=()=>{const{data:n,error:s,isLoading:d,isCanceled:o,reset:r,cancel:h}=l.use(i);return d?e.jsxs("div",{children:[e.jsx("button",{onClick:()=>h(),children:"Cancel"}),e.jsx("h1",{children:"Loading..."})]}):s||o?e.jsxs("div",{children:[e.jsx("h1",{children:s?`${s.name} - ${s.message}`:"Canceled"}),e.jsx("button",{onClick:a=>r(),children:"Reload"})]}):e.jsxs("div",{children:[e.jsx("button",{onClick:a=>r(),children:"Reload"}),n.map(({id:a,first_name:j,last_name:m})=>e.jsxs("div",{children:[a," - ",j," ",m]},a))]})}});export{u as __tla,c as default};
