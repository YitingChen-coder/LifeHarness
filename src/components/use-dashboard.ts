'use client';
import { useEffect, useState } from 'react';
import type { DashboardData } from '@/lib/store';
export function useDashboard(date:string) {
 const [data,setData]=useState<DashboardData|null>(null);
 const [error,setError]=useState<string|null>(null);
 const [loading,setLoading]=useState(true);
 useEffect(()=>{
  let active=true,inFlight=false;let controller:AbortController|null=null;
  setLoading(true);setError(null);
  async function refresh(){
   if(inFlight)return;inFlight=true;controller=new AbortController();
   const timeout=setTimeout(()=>controller?.abort(),2000);
   try{
    const response=await fetch(`/api/dashboard?date=${encodeURIComponent(date)}`,{cache:'no-store',signal:controller.signal});
    if(!response.ok)throw new Error('Local dashboard could not refresh.');
    const next:DashboardData=await response.json();
    if(active){
     setData(previous => next.warnings.some(w=>w.startsWith('The plan')) && previous?.date===date && previous.plan ? {...next,plan:previous.plan} : next);
     setError(null);setLoading(false);
    }
   }catch{if(active){setError('Connection interrupted. Showing the last available view; retrying automatically.');setLoading(false);}}
   finally{clearTimeout(timeout);inFlight=false;}
  }
  void refresh();const interval=setInterval(refresh,3000);
  return()=>{active=false;clearInterval(interval);controller?.abort();};
 },[date]);
 return {data:data?.date===date?data:null,error,loading};
}
