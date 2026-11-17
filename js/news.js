window.pageControllers=window.pageControllers||{};

(() => {
 const badgeId="news-unread-count";
 let unreadCount=0;
 let activeUserId=null;
 let knownArticleIds=[];
 let readArticleIds=new Set();

 const validArticles=()=>(
  Array.isArray(window.NEWS_ARTICLES)
   ? window.NEWS_ARTICLES.filter(a=>a&&a.id&&a.title&&a.content)
   : []
 );

 function renderSidebarCount(){
  const badge=document.getElementById(badgeId);
  if(!badge)return;
  badge.textContent=unreadCount>99?"99+":String(unreadCount);
  badge.hidden=unreadCount===0;
  badge.setAttribute("aria-label",`${unreadCount} unread news articles`);
 }

 function setReadState(ids){
  readArticleIds=new Set(ids);
  unreadCount=knownArticleIds.filter(id=>!readArticleIds.has(id)).length;
  renderSidebarCount();
 }

 async function loadReadHistory(userId,articleIds){
  if(!window.db||!userId||!articleIds.length){
   setReadState([]);
   return;
  }
  const {data,error}=await db.from("user_news_reads")
   .select("article_id")
   .eq("user_id",userId)
   .in("article_id",articleIds);
  if(error)throw error;
  setReadState((data||[]).map(row=>row.article_id));
 }

 window.refreshNewsUnreadCount=async()=>{
  const user=window.currentUser;
  const ids=validArticles().map(a=>String(a.id));
  knownArticleIds=ids;
  if(!user||!window.db){
   activeUserId=null;
   readArticleIds=new Set();
   unreadCount=0;
   renderSidebarCount();
   return;
  }
  if(activeUserId!==user.id){
   activeUserId=user.id;
   readArticleIds=new Set();
  }
  try{
   await loadReadHistory(user.id,ids);
  }catch(error){
   console.warn("Could not load unread news count:",error);
   // Keep the newsroom usable if reading history is temporarily unavailable.
   unreadCount=0;
   renderSidebarCount();
  }
 };

 async function markArticleRead(articleId){
  const user=window.currentUser;
  if(!user||!window.db||!articleId)return;
  const id=String(articleId);
  if(readArticleIds.has(id))return;
  const wasKnown=knownArticleIds.includes(id);
  readArticleIds.add(id);
  if(wasKnown)unreadCount=Math.max(0,unreadCount-1);
  renderSidebarCount();
  try{
   const {error}=await db.from("user_news_reads").upsert(
    {user_id:user.id,article_id:id},
    {onConflict:"user_id,article_id",ignoreDuplicates:true}
   );
   if(error)throw error;
  }catch(error){
   console.error("Could not save news reading history:",error);
   readArticleIds.delete(id);
   if(wasKnown)unreadCount+=1;
   renderSidebarCount();
   if(typeof toast==="function")toast("Could not save your reading history. Please try again.","error");
  }
 }

 window.pageControllers.news=async()=>{
  const root=document.getElementById("news-view");
  const grid=document.getElementById("news-grid");
  const featured=document.getElementById("news-featured");
  const empty=document.getElementById("news-empty");
  const detail=document.getElementById("news-article-view");
  const tabs=document.getElementById("news-categories");
  const search=document.getElementById("news-search");
  if(!root||!grid||!featured||!tabs||!search)return;

  const articles=validArticles();
  let category="all",query="";
  const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const niceDate=v=>{const d=new Date((v||"")+"T00:00:00");return Number.isNaN(d.getTime())?"":d.toLocaleDateString(undefined,{day:"numeric",month:"short",year:"numeric"});};
  const image=(a,cls="")=>a.image?`<img class="${cls}" src="${esc(a.image)}" alt="${esc(a.title)}" loading="lazy" onerror="this.style.display='none'">`:`<div class="${cls} pro-news-image-placeholder"><span>NEWS</span></div>`;
  const categoryName=c=>({business:"Business",forex:"Forex",stocks:"Stock Market",crypto:"Crypto",economy:"Economy",trading:"Trading",markets:"Markets"}[c]||"News");
  const isUnread=a=>!!window.currentUser&&!readArticleIds.has(String(a.id));
  const newBadge=a=>isUnread(a)?'<span class="news-new-badge">NEW</span>':"";
  const articleCard=a=>`<article class="pro-news-card"><button class="pro-news-card-image" type="button" data-open-article="${esc(a.id)}">${image(a)}<span class="image-category">${esc(categoryName(a.category))}</span>${newBadge(a)}<span class="sample-article-label">SAMPLE</span></button><div class="pro-news-card-body"><div class="pro-news-meta">${esc(categoryName(a.category))}<span>·</span>${esc(niceDate(a.date))}<span class="sample-meta-label">DEMO ARTICLE</span></div><h3><button type="button" data-open-article="${esc(a.id)}">${esc(a.title)}</button></h3><p>${esc(a.excerpt)}</p><div class="pro-news-byline">${esc(a.author||"News Desk")} <button type="button" data-open-article="${esc(a.id)}">Read story <span>→</span></button></div></div></article>`;
  const featuredArticle=articles.find(a=>a.featured)||articles[0];
  const breaking=articles.filter(a=>a.breaking);
  const ticker=document.getElementById("news-breaking"),tickerItems=document.getElementById("news-breaking-items");
  if(breaking.length){ticker.hidden=false;tickerItems.innerHTML=breaking.map(a=>`<button type="button" data-open-article="${esc(a.id)}">${newBadge(a)} ${esc(a.title)}</button>`).join('<span class="ticker-separator">•</span>');}
  const dateNode=document.getElementById("news-today");if(dateNode)dateNode.textContent=new Date().toLocaleDateString(undefined,{weekday:"long",day:"numeric",month:"long",year:"numeric"});

  const showDetail=async id=>{
   const a=articles.find(x=>String(x.id)===String(id));if(!a)return;
   await markArticleRead(a.id);
   root.hidden=true;empty.hidden=true;detail.hidden=false;
   detail.innerHTML=`<article class="pro-news-article"><button class="pro-news-back" type="button" id="news-back">← Back to Major News</button><div class="pro-news-article-head"><span>${esc(categoryName(a.category))} · ${esc(niceDate(a.date))} · DEMO ARTICLE ${newBadge(a)}</span><h1>${esc(a.title)}</h1><p>${esc(a.excerpt)}</p><div class="article-author">By <strong>${esc(a.author||"News Desk")}</strong></div></div>${image(a,"pro-news-article-image")}<div class="pro-news-article-content">${String(a.content).split(/\n\s*\n/).map(p=>`<p>${esc(p).replace(/\n/g,"<br>")}</p>`).join("")}</div><div class="pro-news-article-footer">End of article · MY DAILY ROUTINE Newsroom</div></article>`;
   document.getElementById("news-back").addEventListener("click",()=>{detail.hidden=true;root.hidden=false;render();});
   document.getElementById("content")?.scrollTo?.({top:0,behavior:"smooth"});
  };

  const render=()=>{
   const filtered=articles.filter(a=>(category==="all"||a.category===category)&&(`${a.title} ${a.excerpt} ${a.author||""}`).toLowerCase().includes(query));
   const lead=filtered.find(a=>a.id===featuredArticle?.id)||filtered[0];
   const rest=filtered.filter(a=>a.id!==lead?.id);
   const featureNode=document.getElementById("news-featured");
   featureNode.innerHTML=lead?`<article class="pro-news-featured"><button class="featured-image" type="button" data-open-article="${esc(lead.id)}">${image(lead)}<span class="featured-image-label">FEATURED</span>${newBadge(lead)}</button><div class="featured-copy"><div class="pro-news-meta">${esc(categoryName(lead.category))}<span>·</span>${esc(niceDate(lead.date))}<span class="sample-meta-label">DEMO ARTICLE</span></div><h2><button type="button" data-open-article="${esc(lead.id)}">${esc(lead.title)}</button></h2><p>${esc(lead.excerpt)}</p><div class="pro-news-byline">By <strong>${esc(lead.author||"News Desk")}</strong><button type="button" data-open-article="${esc(lead.id)}">Read full story <span>→</span></button></div></div></article>`:"";
   grid.innerHTML=rest.map(articleCard).join("");
   document.getElementById("news-count").textContent=`${filtered.length} ${filtered.length===1?"story":"stories"}`;
   const noArticles=articles.length===0;empty.hidden=!noArticles;root.hidden=noArticles;detail.hidden=true;
   if(!noArticles&&!filtered.length){featureNode.innerHTML="";grid.innerHTML='<div class="pro-news-no-results">No stories match your search. Try another keyword or category.</div>';}
  };

  const clickHandler=e=>{const btn=e.target.closest("[data-open-article]");if(btn)showDetail(btn.dataset.openArticle);};
  root.addEventListener("click",clickHandler);ticker?.addEventListener("click",clickHandler);
  tabs.addEventListener("click",e=>{const b=e.target.closest("button[data-category]");if(!b)return;category=b.dataset.category;tabs.querySelectorAll("button").forEach(x=>x.classList.toggle("active",x===b));render();});
  search.addEventListener("input",()=>{query=search.value.trim().toLowerCase();render();});

  await window.refreshNewsUnreadCount();
  render();
  return ()=>{root.removeEventListener("click",clickHandler);ticker?.removeEventListener("click",clickHandler);};
 };
})();
