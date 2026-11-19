const routeNames=["dashboard","prayers","expenses","trading","calendar","analytics","profile","settings","admin","news","privacy"];
let activeCleanup=null;
async function routeTo(name,push=true){
 if(!routeNames.includes(name))name="dashboard";
 if(push&&location.hash.slice(1)!==name)history.pushState({route:name},"",`#${name}`);
 $("#content").innerHTML='<div class="loading"><span class="spinner"></span> Loading…</div>';
 try{
  const response=await fetch(`pages/${name}.html`,{cache:"no-store"});if(!response.ok)throw new Error(`Page request failed (${response.status})`);
  const html=await response.text();if(activeCleanup){activeCleanup();activeCleanup=null;}
  $("#content").innerHTML=html;
  $$("#side-nav a[data-route],.sidebar nav a[data-route]").forEach(a=>a.classList.toggle("active",a.dataset.route===name));
  $("#page-heading").textContent=({dashboard:"Overview",prayers:"Prayer tracker",expenses:"Expenses",trading:"Trading journal",calendar:"Calendar & tasks",analytics:"Analytics",profile:"My profile",settings:"Settings",admin:"Admin dashboard",news:"Major News",privacy:"Privacy Policy"})[name];
  $("#today-label").textContent=new Date().toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"}).toUpperCase();
  const init=window.pageControllers?.[name];if(init){const cleanup=await init();if(typeof cleanup==="function")activeCleanup=cleanup;}
  if(typeof setMenuOpen==="function")setMenuOpen(false);
 }catch(e){$("#content").innerHTML=`<div class="panel error-state"><h2>We couldn't load this page</h2><p>${escapeHTML(e.message)}</p><button class="btn primary" onclick="routeTo('dashboard')">Return to overview</button></div>`;}
}
window.addEventListener("hashchange",()=>routeTo(location.hash.slice(1),false));
window.addEventListener("popstate",()=>routeTo(location.hash.slice(1)||"dashboard",false));
document.addEventListener("click",e=>{const a=e.target.closest('a[href^="#"]');if(a?.dataset.route){e.preventDefault();routeTo(a.dataset.route,true);}});

const sidebar=$("#sidebar");
const menuButton=$("#menu-btn");
const backdrop=$("#sidebar-backdrop");

function setMenuOpen(open){
 sidebar.classList.toggle("open",open);
 backdrop.classList.toggle("visible",open);
 document.body.classList.toggle("menu-open",open);
 menuButton?.setAttribute("aria-expanded",String(open));
 menuButton?.setAttribute("aria-label",open?"Close menu":"Open menu");
}

menuButton.addEventListener("click",()=>setMenuOpen(!sidebar.classList.contains("open")));
backdrop.addEventListener("click",()=>setMenuOpen(false));

// A tap/click inside the drawer must not be treated as an outside click.
sidebar.addEventListener("click",event=>event.stopPropagation());

// Close with Escape for keyboard and Android hardware-keyboard users.
document.addEventListener("keydown",event=>{
 if(event.key==="Escape"&&sidebar.classList.contains("open"))setMenuOpen(false);
});

// Keep background scroll locked while the mobile drawer is open.
window.addEventListener("resize",()=>{
 if(window.innerWidth>760&&sidebar.classList.contains("open"))setMenuOpen(false);
});
