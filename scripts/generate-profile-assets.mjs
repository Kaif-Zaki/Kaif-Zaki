const username = process.env.GITHUB_USERNAME || "Kaif-Zaki";
const token = process.env.GITHUB_TOKEN;
if (!token) throw new Error("GITHUB_TOKEN is required.");

const end = new Date();
const start = new Date(end);
start.setUTCDate(start.getUTCDate() - 365);
const query = "query($login:String!,$from:DateTime!,$to:DateTime!){user(login:$login){followers{totalCount} repositories(first:100,ownerAffiliations:OWNER,privacy:PUBLIC,isFork:false){totalCount nodes{stargazerCount forkCount languages(first:10,orderBy:{field:SIZE,direction:DESC}){edges{size node{name}}}}} contributionsCollection(from:$from,to:$to){totalCommitContributions totalPullRequestContributions totalIssueContributions contributionCalendar{totalContributions weeks{contributionDays{date contributionCount}}}}}}";
const response = await fetch("https://api.github.com/graphql", {
  method: "POST",
  headers: { Authorization: "Bearer " + token, "Content-Type": "application/json", "User-Agent": "Kaif-Zaki-profile-assets" },
  body: JSON.stringify({ query, variables: { login: username, from: start.toISOString(), to: end.toISOString() } })
});
if (!response.ok) throw new Error("GitHub API failed: " + response.status + " " + await response.text());
const json = await response.json();
if (json.errors) throw new Error(json.errors.map(x => x.message).join("; "));
const user = json.data && json.data.user;
if (!user) throw new Error("GitHub user not found: " + username);

const repos = user.repositories.nodes;
const calendar = user.contributionsCollection.contributionCalendar;
const days = calendar.weeks.flatMap(w => w.contributionDays);
const stars = repos.reduce((n, r) => n + r.stargazerCount, 0);
const forks = repos.reduce((n, r) => n + r.forkCount, 0);
const esc = s => String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
const bg = "#0D1117", fg = "#C9D1D9", muted = "#8B949E", accent = "#A5B4FC";
const colors = ["#818CF8","#60A5FA","#34D399","#FBBF24","#F472B6","#A78BFA","#22D3EE","#FB923C"];
const base = (w,h,label) => '<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'" role="img" aria-label="'+esc(label)+'"><rect width="100%" height="100%" rx="14" fill="'+bg+'"/><rect x="1" y="1" width="'+(w-2)+'" height="'+(h-2)+'" rx="13" fill="none" stroke="#30363D"/>';
const card = (w,h,label,inner) => base(w,h,label)+inner+"</svg>";
const stats = [
  ["Public repositories",user.repositories.totalCount],
  ["Followers",user.followers.totalCount],
  ["Stars earned",stars],
  ["Forks",forks],
  ["Commits (1 year)",user.contributionsCollection.totalCommitContributions],
  ["Contributions (1 year)",calendar.totalContributions]
];
let statsInner = '<text x="28" y="35" fill="'+accent+'" font-size="17" font-weight="700">Kaif\'s GitHub Stats</text>';
stats.forEach((item,i) => {
  const x=28+(i%3)*155, y=72+Math.floor(i/3)*72;
  statsInner += '<text x="'+x+'" y="'+y+'" fill="'+muted+'" font-size="12">'+esc(item[0])+'</text><text x="'+x+'" y="'+(y+28)+'" fill="'+fg+'" font-size="23" font-weight="700">'+Number(item[1]).toLocaleString("en-US")+'</text>';
});
const langBytes = new Map(), langRepos = new Map();
for (const repo of repos) for (const edge of repo.languages.edges) {
  const name=edge.node.name;
  langBytes.set(name,(langBytes.get(name)||0)+edge.size);
  langRepos.set(name,(langRepos.get(name)||0)+1);
}
function languageCard(entries,title,w,h) {
  const top=entries.sort((a,b)=>b[1]-a[1]).slice(0,6);
  const total=top.reduce((n,x)=>n+x[1],0)||1;
  let inner='<text x="24" y="32" fill="'+accent+'" font-size="16" font-weight="700">'+esc(title)+'</text>';
  top.forEach((item,i)=>{
    const y=59+i*19, pct=item[1]/total*100;
    inner+='<text x="24" y="'+y+'" fill="'+fg+'" font-size="11">'+esc(item[0])+'</text>';
    inner+='<rect x="145" y="'+(y-9)+'" width="220" height="8" rx="4" fill="#30363D"/>';
    inner+='<rect x="145" y="'+(y-9)+'" width="'+Math.max(2,220*pct/100)+'" height="8" rx="4" fill="'+colors[i%colors.length]+'"/>';
    inner+='<text x="385" y="'+y+'" fill="'+muted+'" font-size="11">'+pct.toFixed(1)+'%</text>';
  });
  if (!top.length) inner+='<text x="24" y="75" fill="'+muted+'" font-size="12">No public language data yet</text>';
  return card(w,h,title,inner);
}
let run=0,longest=0;
for (const d of days) { run=d.contributionCount>0?run+1:0; longest=Math.max(longest,run); }
const todayKey=end.toISOString().slice(0,10);
const yesterday=new Date(end); yesterday.setUTCDate(yesterday.getUTCDate()-1);
let idx=days.length-1;
if (days[idx] && days[idx].date===todayKey && days[idx].contributionCount===0) idx--;
let current=0;
if (days[idx] && (days[idx].date===todayKey || days[idx].date===yesterday.toISOString().slice(0,10))) {
  while(idx>=0 && days[idx].contributionCount>0){current++;idx--;}
}
const streak=card(980,140,"Contribution streak",
  '<text x="28" y="36" fill="'+accent+'" font-size="18" font-weight="700">Contribution Streak</text>'+
  '<text x="250" y="92" fill="'+fg+'" font-size="42" font-weight="700" text-anchor="middle">'+current+'</text>'+
  '<text x="250" y="116" fill="'+muted+'" font-size="13" text-anchor="middle">Current streak (days)</text>'+
  '<text x="730" y="92" fill="'+fg+'" font-size="42" font-weight="700" text-anchor="middle">'+longest+'</text>'+
  '<text x="730" y="116" fill="'+muted+'" font-size="13" text-anchor="middle">Longest streak (days)</text>');
let graph='<text x="28" y="31" fill="'+accent+'" font-size="17" font-weight="700">Kaif\'s Contribution Graph</text><text x="28" y="48" fill="'+muted+'" font-size="11">'+calendar.totalContributions.toLocaleString("en-US")+' contributions in the last year</text>';
const palette=["#161B22","#312E81","#4338CA","#6366F1","#A5B4FC"];
const max=Math.max(1,...days.map(d=>d.contributionCount));
calendar.weeks.forEach((week,wi)=>week.contributionDays.forEach(day=>{
  const weekday=new Date(day.date+"T00:00:00Z").getUTCDay();
  const level=day.contributionCount===0?0:Math.min(4,Math.max(1,Math.ceil(day.contributionCount/max*4)));
  graph+='<rect x="'+(28+wi*15)+'" y="'+(62+weekday*15)+'" width="11" height="11" rx="2" fill="'+palette[level]+'"><title>'+esc(day.date)+': '+day.contributionCount+' contributions</title></rect>';
}));
graph+='<text x="28" y="169" fill="'+muted+'" font-size="10">Less</text>';
palette.forEach((c,i)=>graph+='<rect x="'+(62+i*17)+'" y="158" width="11" height="11" rx="2" fill="'+c+'"/>');
graph+='<text x="150" y="169" fill="'+muted+'" font-size="10">More</text>';
const activity=card(980,190,"Contribution activity graph",graph);

const fs = await import("node:fs/promises");
await fs.mkdir("profile",{recursive:true});
const assets={
  "stats.svg":card(490,180,"GitHub statistics",statsInner),
  "languages.svg":languageCard([...langBytes.entries()],"Top Languages",490,180),
  "repos-per-language.svg":languageCard([...langRepos.entries()],"Repositories per Language",310,180),
  "streak.svg":streak,
  "activity.svg":activity
};
for (const [name,svg] of Object.entries(assets)) await fs.writeFile("profile/"+name,svg,"utf8");
console.log("Generated "+Object.keys(assets).length+" SVG assets for "+username+".");
