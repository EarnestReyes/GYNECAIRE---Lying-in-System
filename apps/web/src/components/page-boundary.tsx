import { Component, type PropsWithChildren } from 'react';
import { navigate, type Page } from '../lib/navigation';
export class PageBoundary extends Component<PropsWithChildren<{page:Page}>,{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 render(){return this.state.failed?<div className="notice error" role="alert"><div><strong>This page could not be loaded.</strong><p>Check your connection and reload the portal.</p></div><button className="button secondary" onClick={()=>window.location.reload()}>Reload portal</button>{this.props.page!=='dashboard'&&<button className="button secondary" onClick={()=>navigate('dashboard')}>Dashboard</button>}</div>:this.props.children;}
}
