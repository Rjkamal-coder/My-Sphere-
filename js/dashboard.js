window.pageControllers=window.pageControllers||{};
pageControllers.dashboard=async()=>{
 const period=$("#dash-period"),dateLabel=$("#dash-date-label"),dateInput=$("#dash-month");
 const now=new Date(),todayString=today();
 const localDate=(d)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
 const periodValue=()=>period.value==="day"?dateInput.value:period.value==="month"?dateInput.value:dateInput.value;
 period.value="month";dateInput.type="month";dateInput.value=monthNow();
 $("#dash-date").textContent=new Date().toLocaleDateString(undefined,{weekday:"long",day:"numeric",month:"long",year:"numeric"});
 const displayName=(window.userProfile?.display_name||window.userProfile?.full_name||window.currentUser?.user_metadata?.full_name||window.currentUser?.email?.split("@")[0]||"there").trim();
 $("#dashboard-user-name").textContent=displayName;
 const rangeRows=(rows)=>{
  const value=periodValue();
  return rows.filter(r=>{
   const d=String(r.date||"");
   if(period.value==="day")return d===value;
   if(period.value==="month")return d.startsWith(value);
   return d.startsWith(value);
  });
 };
 const periodLabel=()=>period.value==="day"?"Daily":period.value==="year"?"Yearly":"Monthly";
 const load=async()=>{
  const [p,e,t,tasks]=await Promise.all([getRows("prayer_records"),getRows("expenses"),getRows("trading_records"),getRows("daily_tasks")]);
  const ps=rangeRows(p),es=rangeRows(e),ts=rangeRows(t),ds=rangeRows(tasks);
  const prayerDone=ps.reduce((s,r)=>s+["fajr","dhuhr","asr","maghrib","isha"].filter(k=>r[k]===true).length,0);
  const prayerTotal=ps.length*5;
  const taskDone=ds.filter(x=>x.completed===true).length,taskTotal=ds.length;
  const spend=es.reduce((s,r)=>s+Number(r.amount||0),0),wins=ts.reduce((s,r)=>s+Number(r.winning_amount||0),0),loss=ts.reduce((s,r)=>s+Number(r.losing_amount||0),0),net=wins-loss;
  // Growth Score combines every available tracked area. Financial health is
  // measured against the income budget for the selected day/month/year.
  const tracked=[];
  if(prayerTotal)tracked.push(prayerDone/prayerTotal*100);
  if(taskTotal)tracked.push(taskDone/taskTotal*100);
  if(ts.length && wins+loss>0)tracked.push(Math.max(0,Math.min(100,50+(net/(wins+loss))*50)));
  const monthlyIncome=Number(userProfile?.monthly_income||0);
  let periodIncome=0;
  if(monthlyIncome>0){
   if(period.value==="day"){
    const selected=new Date(`${dateInput.value}T12:00:00`);
    periodIncome=monthlyIncome/new Date(selected.getFullYear(),selected.getMonth()+1,0).getDate();
   }else if(period.value==="year") periodIncome=monthlyIncome*12;
   else periodIncome=monthlyIncome;
   tracked.push(Math.max(0,Math.min(100,(1-(spend/periodIncome))*100)));
  }
  // A newly registered account starts at 0%. No activity must never display a
  // dash or an artificial score. Once data is recorded, average only the areas
  // that have actual records (plus income when the user has configured it).
  const growth=tracked.length?Math.round(tracked.reduce((a,b)=>a+b,0)/tracked.length):0;
  $("#growth-score-value").textContent=`${growth}%`;
  $("#growth-score-detail").textContent=tracked.length
   ? `Based on ${tracked.length} tracked ${tracked.length===1?"area":"areas"}${monthlyIncome<=0?" · Add income to include expenses":""}`
   : "No activity recorded yet";
  $("#growth-score-ring").style.setProperty("--score",`${growth}%`);
  const winTrades=ts.filter(r=>r.result==="win").length,lossTrades=ts.filter(r=>r.result==="loss").length;
  const cards=[[ "Prayer completion",prayerTotal?`${Math.round(prayerDone/prayerTotal*100)}%`:"—",`${prayerDone}/${prayerTotal} prayers`],["Total expenses",money(spend),`${es.length} records`],["Trading profit",money(wins),"Winning amount"],["Trading losses",money(loss),"Losing amount"],["Net trading P/L",money(net),`${ts.length} trading days`],["Win rate",ts.length?`${Math.round(winTrades/ts.length*100)}%`:"—",`${winTrades} wins · ${lossTrades} losses`],["Tasks completed",`${taskDone}/${taskTotal}`,"Personal tasks"],["Period savings",monthlyIncome?money(periodIncome-spend):"—",monthlyIncome?"Estimated income minus expenses":"Add income in profile settings"]];
  $("#monthly-stats").innerHTML=cards.map((c,i)=>`<article class="stat-card"><span>${c[0]}</span><strong class="${i===4?(net>=0?"positive":"negative"):""}">${c[1]}</strong><small>${c[2]}</small></article>`).join("");
  $("#activity-chart").innerHTML=`<div class="progress-line"><span>Prayer completion</span><b>${prayerTotal?Math.round(prayerDone/prayerTotal*100):0}%</b></div><div class="track"><i style="width:${prayerTotal?prayerDone/prayerTotal*100:0}%"></i></div><div class="progress-line"><span>Task completion</span><b>${taskTotal?Math.round(taskDone/taskTotal*100):0}%</b></div><div class="track"><i style="width:${taskTotal?taskDone/taskTotal*100:0}%"></i></div>`;
  $("#trade-snapshot").innerHTML=`<div class="net-value ${net>=0?"positive":"negative"}">${money(net)}</div><div class="snapshot-grid"><span>Trades<strong>${ts.length}</strong></span><span>Wins<strong>${winTrades}</strong></span><span>Losses<strong>${lossTrades}</strong></span></div>`;
  const todayRecord=p.find(x=>x.date===todayString);$("#today-prayers").innerHTML=["Fajr","Dhuhr","Asr","Maghrib","Isha"].map(k=>`<span class="prayer-chip ${todayRecord?.[k.toLowerCase()]===true?"done":todayRecord?.[k.toLowerCase()]===false?"missed":""}">${k}</span>`).join("");
  const todayTasks=tasks.filter(x=>x.date===todayString);$("#today-tasks").innerHTML=todayTasks.length?todayTasks.map(x=>`<div class="task-line">${x.completed?"✓":"○"} ${escapeHTML(x.title)}</div>`).join(""):'<p class="muted">No tasks planned for today.</p>';
  $$(".panel-head h3").forEach(h=>{if(h.textContent==="Monthly activity")h.textContent=`${periodLabel()} activity`;});
 };
 const syncDateControl=()=>{
  const mode=period.value;dateInput.type=mode==="day"?"date":mode==="year"?"number":"month";
  dateInput.min=mode==="year"?"2000":"";dateInput.max=mode==="year"?"2100":"";
  dateInput.step=mode==="year"?"1":"";
  dateLabel.firstChild.textContent=mode==="day"?"Select day":mode==="year"?"Select year":"Select month";
  if(mode==="day")dateInput.value=todayString;
  else if(mode==="year")dateInput.value=String(new Date().getFullYear());
  else dateInput.value=monthNow();
 };
 period.onchange=()=>{syncDateControl();load().catch(e=>toast(e.message,"error"));};
 dateInput.onchange=()=>load().catch(e=>toast(e.message,"error"));
 $("#refresh-dashboard").onclick=()=>load().catch(e=>toast(e.message,"error"));
 await load();
 $("#daily-quote").textContent=["Consistency is built one small decision at a time.","Progress is better than perfection.","Make the next choice a good one.","A focused day is made of focused moments."][new Date().getDate()%4];
};
