const msg=id=>document.getElementById(id);
const reg=document.getElementById("register-form");
if(reg)reg.addEventListener("submit",async e=>{
 e.preventDefault();
 const button=reg.querySelector('button[type="submit"],button:not([type])');
 const output=msg("register-message");
 if(button){button.disabled=true;button.textContent="Creating account…";}
 try{
  if(!window.db)throw new Error("The account service is unavailable. Please refresh and try again.");
  const {data,error}=await db.auth.signUp({email:document.getElementById("reg-email").value.trim(),password:document.getElementById("reg-password").value,options:{data:{display_name:document.getElementById("reg-name").value.trim()},emailRedirectTo:new URL("index.html",location.href).href}});
  if(error)throw error;
  if(data.session){output.textContent="Your account is ready. Opening your workspace…";setTimeout(()=>location.assign("index.html#dashboard"),500);}
  else output.innerHTML='Account created. Check your inbox for the confirmation email. After confirming, <a href="index.html#signin">sign in here</a>.';
 }catch(error){output.textContent=error.message||"Unable to create your account. Please try again.";}
 finally{if(button){button.disabled=false;button.textContent="Create account";}}
});
const reset=document.getElementById("reset-form");
if(reset)reset.addEventListener("submit",async e=>{
 e.preventDefault();const button=reset.querySelector('button[type="submit"],button:not([type])');if(button)button.disabled=true;
 try{if(!window.db)throw new Error("The account service is unavailable. Please refresh and try again.");const {error}=await db.auth.resetPasswordForEmail(document.getElementById("reset-email").value.trim(),{redirectTo:new URL("index.html",location.href).href});if(error)throw error;msg("reset-message").textContent="If the email is registered, a reset link has been sent.";}
 catch(error){msg("reset-message").textContent=error.message||"Unable to send the reset email. Please try again.";}
 finally{if(button)button.disabled=false;}
});
