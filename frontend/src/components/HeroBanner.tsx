import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { publicApi } from '../api/client';
import type { HomeConfig } from '../types';
import './HeroBanner.css';
export default function HeroBanner() {
 const [config,setConfig]=useState<HomeConfig|null>(null); const [index,setIndex]=useState(0);
 useEffect(()=>{ publicApi.get<HomeConfig>('/home').then(setConfig).catch(()=>setConfig(null)); },[]);
 const banners=config?.banners ?? [];
 useEffect(()=>{ if(banners.length<2)return; const timer=window.setInterval(()=>setIndex(v=>(v+1)%banners.length),5000); return ()=>window.clearInterval(timer); },[banners.length]);
 if(!banners.length) return <section className="hero-banner"><Link to="/tienda/descuentos" className="hero-banner__link"><span>AURA</span><span className="hero-banner__button">SALE UP TO 40%</span></Link></section>;
 const banner=banners[index % banners.length]; const to=banner.linkType==='product'?`/producto/${banner.linkTarget}`:banner.linkType==='filter'?`/tienda/${banner.linkTarget}`:banner.linkTarget;
 return <section className="hero-banner hero-banner--configured">{banner.mediaType==='video'?<video className="hero-banner__media" src={banner.mediaUrl} autoPlay muted loop playsInline/>:<img className="hero-banner__media" src={banner.mediaUrl} alt={banner.title}/>}<div className="hero-banner__overlay"><h1>{banner.title}</h1><Link to={to} className="hero-banner__button">{banner.buttonText}</Link></div>{banners.length>1&&<div className="hero-banner__dots">{banners.map((item,i)=><button key={`${item.title}-${i}`} aria-label={`Banner ${i+1}`} onClick={()=>setIndex(i)} className={i===index?'active':''}/>)}</div>}</section>;
}
