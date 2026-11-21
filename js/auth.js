window.currentUser=null;window.userProfile=null;
async function loadProfile(){
 const {data,error}=await db.from("profiles").select("*").eq("id",currentUser.id).maybeSingle();
 if(error)throw error;
 if(!data){const {data:d,error:e}=await db.from("profiles").insert({id:currentUser.id,display_name:currentUser.user_metadata?.display_name||currentUser.email.split("@")[0],currency:"BDT"}).select().single();if(e)throw e;userProfile=d;}else userProfile=data;
}
async function refreshIdentity(){
 const name=userProfile?.display_name||currentUser.email;
 $("#side-name").textContent=name;$("#side-email").textContent=currentUser.email;
 const avatar=userProfile?.avatar_url||"assets/images/avatar.svg";$("#side-avatar").src=avatar;$("#header-avatar").src=avatar;
 const {data}=await db.rpc("is_admin");$("#admin-nav").classList.toggle("hidden",!data);
}
async function signOut(){const {error}=await db.auth.signOut();if(error)toast(error.message,"error");}
$("#login-form").addEventListener("submit",async e=>{
 e.preventDefault();
 const b=e.submitter||e.currentTarget.querySelector('button[type="submit"],button:not([type])');
 if(b)b.disabled=true;
 $("#auth-message").textContent="Signing in…";
 try{
  if(!db)throw new Error("The sign-in service is unavailable. Please refresh and try again.");
  const {error}=await db.auth.signInWithPassword({email:$("#login-email").value.trim(),password:$("#login-password").value});
  if(error)throw error;
  $("#auth-message").textContent="Signed in. Opening your workspace…";
 }catch(error){$("#auth-message").textContent=error.message||"Unable to sign in. Please try again.";toast($("#auth-message").textContent,"error");}
 finally{if(b)b.disabled=false;}
});
$("#logout-btn").addEventListener("click",signOut);
db.auth.onAuthStateChange((_event,session)=>{setTimeout(()=>handleSession(session),0);});
async function handleSession(session){
 currentUser=session?.user||null;
 if(!currentUser){
  if(window.stopNews)window.stopNews();$("#app").classList.add("hidden");
  const requested=location.hash.slice(1);
  if(["dashboard","prayers","expenses","trading","calendar","analytics","profile","settings","admin","news"].includes(requested))window.showSignIn?.(requested);
  else if(requested==="signin")window.showSignIn?.();
  else if(requested==="register")window.showRegister?.();
  else window.showPublicHome?.();
  return;
 }
 try{
  await loadProfile();await refreshIdentity();if(window.refreshNewsUnreadBadge)window.refreshNewsUnreadBadge();if(window.startNewsBadgeRealtime)window.startNewsBadgeRealtime();
  $("#public-home").classList.add("hidden");$("#auth-screen").classList.add("hidden");$("#app").classList.remove("hidden");
  const requested=sessionStorage.getItem("growtica-next-route");if(requested)sessionStorage.removeItem("growtica-next-route");
  routeTo(requested||location.hash.slice(1)||"dashboard",false);
 }catch(e){toast("Could not load account: "+e.message,"error");}
}
(async()=>{const {data}=await db.auth.getSession();await handleSession(data.session);})();
