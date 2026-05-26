import React, { useReducer, useEffect, useState, useMemo, useCallback } from 'react';
import {
  LayoutDashboard, Package, Server, FileText, Users, Activity,
  Star, DollarSign, TrendingUp, TrendingDown, ShoppingCart,
  Zap, AlertTriangle, CheckCircle, XCircle, Wifi, WifiOff,
  ChevronRight, ArrowUp, Volume2, Megaphone, Monitor, Cloud,
  Database, Cpu, Globe, X
} from 'lucide-react';

// ============ CONSTANTS ============
const TICK_INTERVAL = 2000; // 2 seconds = 1 in-game hour
const STARTING_CASH = 5000000;

const PRODUCTS = [
  { id: 'mobillejen', name: 'Mobil Lejen', currency: 'Diamonds', icon: '💎', color: 'from-blue-500 to-purple-600' },
  { id: 'frifayer', name: 'Fri Fayer', currency: 'DM', icon: '🔥', color: 'from-orange-500 to-red-600' },
  { id: 'valoran', name: 'Valoran', currency: 'VP', icon: '⚡', color: 'from-cyan-500 to-blue-600' },
  { id: 'pabji', name: 'Pabji', currency: 'UC', icon: '🎯', color: 'from-green-500 to-emerald-600' },
];

const SERVER_TIERS = [
  { id: 1, name: 'Shared Hosting', maxUsers: 500, costPerTick: 5000, price: 0, desc: 'Hosting ala kadarnya' },
  { id: 2, name: 'VPS Standar', maxUsers: 2000, costPerTick: 25000, price: 500000, desc: 'Virtual Private Server' },
  { id: 3, name: 'Cloud AWS', maxUsers: 8000, costPerTick: 100000, price: 2000000, desc: 'Auto-scaling cloud' },
  { id: 4, name: 'Dedicated Server', maxUsers: 25000, costPerTick: 350000, price: 8000000, desc: 'Server pribadi full power' },
];


const MARKETING_OPTIONS = [
  { id: 'tiktok', name: 'TikTok Ads', cost: 300000, duration: 15, trafficBoost: 2.5, icon: '🎵' },
  { id: 'instagram', name: 'IG Ads', cost: 500000, duration: 20, trafficBoost: 3.0, icon: '📸' },
  { id: 'proplayer', name: 'Sponsor Pro Player', cost: 1500000, duration: 30, trafficBoost: 5.0, icon: '🏆' },
];

const RANDOM_EVENTS = [
  {
    id: 'maintenance',
    title: '🔧 Server Game Pusat Maintenance!',
    desc: 'Server game pusat sedang maintenance. Semua topup gagal selama 5 tick!',
    effect: 'maintenance',
    duration: 5,
  },
  {
    id: 'influencer',
    title: '🌟 Influencer Review!',
    desc: 'Seorang YouTuber terkenal mereview website kamu! Traffic naik 500%!',
    effect: 'trafficSpike',
    duration: 8,
  },
  {
    id: 'bocil',
    title: '😤 Bocil Nyepam CS!',
    desc: '"DIAMOND GW MANA WOI!!!" - Bocil epep spam chat CS. Bayar Rp 200.000 uang damai atau reputasi turun!',
    effect: 'bocilComplaint',
    cost: 200000,
    reputationHit: 0.3,
  },
  {
    id: 'promo',
    title: '🎉 Hari Besar Nasional!',
    desc: 'Traffic meningkat drastis karena libur nasional! +300% traffic selama 10 tick!',
    effect: 'holiday',
    duration: 10,
  },
  {
    id: 'competitor',
    title: '⚔️ Kompetitor Perang Harga!',
    desc: 'Kompetitor menurunkan harga drastis! Conversion rate turun 50% selama 8 tick!',
    effect: 'priceWar',
    duration: 8,
  },
];


// ============ INITIAL STATE ============
const initialState = {
  cash: STARTING_CASH,
  tick: 0,
  day: 1,
  hour: 0,
  reputation: 3.5,
  activeUsers: 0,
  serverTier: 1,
  serverCrashed: false,
  autoProcess: false,
  pendingOrders: 0,
  totalRevenue: 0,
  totalExpenses: 0,
  
  // Stock & Pricing per product
  products: {
    mobillejen: { stock: 0, wholesalePrice: 150, retailPrice: 250, unitSize: 100 },
    frifayer: { stock: 0, wholesalePrice: 120, retailPrice: 200, unitSize: 100 },
    valoran: { stock: 0, wholesalePrice: 180, retailPrice: 300, unitSize: 100 },
    pabji: { stock: 0, wholesalePrice: 200, retailPrice: 330, unitSize: 100 },
  },
  
  // Marketing campaigns active
  activeCampaigns: [],
  
  // Active random events
  activeEvents: [],
  
  // Traffic history (last 24 ticks)
  trafficHistory: Array(24).fill(0),
  
  // Live feed messages
  liveFeed: [],
  
  // Finance log
  financeLog: [],
  
  // Game running
  isRunning: true,
  gameOver: false,
  
  // Event popup
  eventPopup: null,
  
  // Ticks since last random event
  ticksSinceEvent: 0,
};


// ============ HELPER FUNCTIONS ============
const formatIDR = (amount) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

const getServerMaxUsers = (tier) => SERVER_TIERS.find(s => s.id === tier)?.maxUsers || 500;
const getServerCost = (tier) => SERVER_TIERS.find(s => s.id === tier)?.costPerTick || 5000;

// ============ REDUCER ============
function gameReducer(state, action) {
  switch (action.type) {
    case 'TICK': {
      if (!state.isRunning || state.gameOver) return state;
      
      let newState = { ...state };
      newState.tick += 1;
      newState.hour = (newState.hour + 1) % 24;
      if (newState.hour === 0) newState.day += 1;
      newState.ticksSinceEvent += 1;
      
      // Decrement campaign durations
      newState.activeCampaigns = state.activeCampaigns
        .map(c => ({ ...c, remaining: c.remaining - 1 }))
        .filter(c => c.remaining > 0);
      
      // Decrement active event durations
      newState.activeEvents = state.activeEvents
        .map(e => ({ ...e, remaining: e.remaining - 1 }))
        .filter(e => e.remaining > 0);
      
      // Check if server was crashed - recover after 3 ticks
      if (state.serverCrashed) {
        if (newState.tick % 3 === 0) {
          newState.serverCrashed = false;
          newState.liveFeed = [{ msg: '[RECOVERY] Server kembali online! 🟢', type: 'success', tick: newState.tick }, ...state.liveFeed].slice(0, 50);
        } else {
          newState.activeUsers = 0;
          newState.trafficHistory = [...state.trafficHistory.slice(1), 0];
          return newState;
        }
      }


      // === TRAFFIC ALGORITHM ===
      const baseTraffic = 50 + (state.reputation * 80);
      const timeMultiplier = (newState.hour >= 18 && newState.hour <= 23) ? 2.2 :
                             (newState.hour >= 12 && newState.hour <= 17) ? 1.5 :
                             (newState.hour >= 7 && newState.hour <= 11) ? 1.0 : 0.4;
      
      let campaignBoost = 1;
      newState.activeCampaigns.forEach(c => { campaignBoost += (c.trafficBoost - 1); });
      
      let eventMultiplier = 1;
      const hasTrafficSpike = newState.activeEvents.find(e => e.effect === 'trafficSpike');
      const hasHoliday = newState.activeEvents.find(e => e.effect === 'holiday');
      const hasPriceWar = newState.activeEvents.find(e => e.effect === 'priceWar');
      if (hasTrafficSpike) eventMultiplier *= 5;
      if (hasHoliday) eventMultiplier *= 3;
      
      const randomFactor = 0.7 + Math.random() * 0.6;
      const calculatedUsers = Math.floor(baseTraffic * timeMultiplier * campaignBoost * eventMultiplier * randomFactor);
      newState.activeUsers = Math.max(0, calculatedUsers);
      
      // === SERVER LOAD CHECK ===
      const maxUsers = getServerMaxUsers(newState.serverTier);
      const serverLoad = newState.activeUsers / maxUsers;
      
      if (serverLoad > 1.0) {
        // SERVER CRASH!
        newState.serverCrashed = true;
        newState.reputation = clamp(newState.reputation - 0.5, 0, 5);
        newState.activeUsers = 0;
        newState.liveFeed = [
          { msg: '[CRITICAL] 🔴 502 BAD GATEWAY - Server down! Reputasi -0.5 ⭐', type: 'error', tick: newState.tick },
          ...state.liveFeed
        ].slice(0, 50);
        newState.trafficHistory = [...state.trafficHistory.slice(1), 0];
        return newState;
      }


      // === ORDER GENERATION ===
      const hasMaintenance = newState.activeEvents.find(e => e.effect === 'maintenance');
      
      if (!hasMaintenance) {
        // Conversion rate based on pricing competitiveness
        let baseConversion = 0.08 + (state.reputation - 3) * 0.02;
        if (hasPriceWar) baseConversion *= 0.5;
        const conversionRate = clamp(baseConversion, 0.02, 0.20);
        
        const numOrders = Math.floor(newState.activeUsers * conversionRate);
        let ordersProcessed = 0;
        let ordersFailed = 0;
        let revenue = 0;
        const newFeed = [];
        
        for (let i = 0; i < numOrders; i++) {
          // Pick random product
          const prodKey = Object.keys(newState.products)[Math.floor(Math.random() * 4)];
          const prod = newState.products[prodKey];
          const prodInfo = PRODUCTS.find(p => p.id === prodKey);
          
          // Check if price is competitive (market price ~ wholesalePrice * 1.8)
          const marketPrice = prod.wholesalePrice * 1.8;
          const priceFactor = marketPrice / prod.retailPrice;
          const willBuy = Math.random() < clamp(priceFactor, 0.3, 1.0);
          
          if (!willBuy) continue;
          
          if (prod.stock < prod.unitSize) {
            ordersFailed++;
            if (i < 3) {
              newFeed.push({ msg: `[FAILED] Out of Stock: ${prod.unitSize} ${prodInfo.currency} ${prodInfo.name}`, type: 'error', tick: newState.tick });
            }
            newState.reputation = clamp(newState.reputation - 0.02, 0, 5);
          } else {
            // Process order
            if (state.autoProcess || state.pendingOrders < 10) {
              newState.products = {
                ...newState.products,
                [prodKey]: { ...prod, stock: prod.stock - prod.unitSize }
              };
              const orderRevenue = prod.retailPrice * prod.unitSize;
              revenue += orderRevenue;
              ordersProcessed++;
              if (i < 2) {
                const username = `User${Math.floor(Math.random() * 999)}`;
                newFeed.push({ msg: `[SUCCESS] ${username} bought ${prod.unitSize} ${prodInfo.currency} ${prodInfo.name} - ${formatIDR(orderRevenue)}`, type: 'success', tick: newState.tick });
              }
            } else {
              newState.pendingOrders += 1;
            }
          }
        }
        
        if (ordersFailed > 2) {
          newFeed.push({ msg: `[WARNING] ${ordersFailed} order gagal karena stok habis!`, type: 'warning', tick: newState.tick });
        }
        
        newState.cash += revenue;
        newState.totalRevenue += revenue;
        newState.reputation = clamp(newState.reputation + (ordersProcessed * 0.005) - (ordersFailed * 0.01), 0, 5);
        newState.liveFeed = [...newFeed, ...state.liveFeed].slice(0, 50);
      } else {
        newState.liveFeed = [
          { msg: '[MAINTENANCE] ⚠️ Server game pusat maintenance - topup gagal!', type: 'warning', tick: newState.tick },
          ...state.liveFeed
        ].slice(0, 50);
      }


      // === SERVER COSTS ===
      const serverCost = getServerCost(newState.serverTier);
      newState.cash -= serverCost;
      newState.totalExpenses += serverCost;
      
      // === FINANCE LOG (daily) ===
      if (newState.hour === 0 && newState.day > 1) {
        newState.financeLog = [
          { day: newState.day - 1, revenue: newState.totalRevenue, expenses: newState.totalExpenses, net: newState.totalRevenue - newState.totalExpenses },
          ...state.financeLog
        ].slice(0, 30);
      }
      
      // === TRAFFIC HISTORY ===
      newState.trafficHistory = [...state.trafficHistory.slice(1), newState.activeUsers];
      
      // === RANDOM EVENTS ===
      if (newState.ticksSinceEvent >= 12 && Math.random() < 0.15) {
        const event = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
        newState.ticksSinceEvent = 0;
        newState.eventPopup = event;
        
        if (event.duration) {
          newState.activeEvents = [...newState.activeEvents, { ...event, remaining: event.duration }];
        }
      }
      
      // === GAME OVER CHECK ===
      if (newState.cash < -1000000) {
        newState.gameOver = true;
        newState.isRunning = false;
      }
      
      return newState;
    }


    case 'BUY_STOCK': {
      const { productId, amount } = action.payload;
      const prod = state.products[productId];
      const totalCost = prod.wholesalePrice * amount;
      if (state.cash < totalCost) return state;
      
      return {
        ...state,
        cash: state.cash - totalCost,
        totalExpenses: state.totalExpenses + totalCost,
        products: {
          ...state.products,
          [productId]: { ...prod, stock: prod.stock + amount }
        },
        liveFeed: [
          { msg: `[STOCK] Beli ${amount.toLocaleString()} unit ${PRODUCTS.find(p => p.id === productId)?.name} - ${formatIDR(totalCost)}`, type: 'info', tick: state.tick },
          ...state.liveFeed
        ].slice(0, 50),
      };
    }
    
    case 'SET_PRICE': {
      const { productId, price } = action.payload;
      return {
        ...state,
        products: {
          ...state.products,
          [productId]: { ...state.products[productId], retailPrice: Math.max(1, price) }
        }
      };
    }
    
    case 'UPGRADE_SERVER': {
      const { tierId } = action.payload;
      const tier = SERVER_TIERS.find(s => s.id === tierId);
      if (!tier || state.cash < tier.price || state.serverTier >= tierId) return state;
      
      return {
        ...state,
        cash: state.cash - tier.price,
        totalExpenses: state.totalExpenses + tier.price,
        serverTier: tierId,
        serverCrashed: false,
        liveFeed: [
          { msg: `[UPGRADE] Server upgraded ke ${tier.name}! Max ${tier.maxUsers} users 🚀`, type: 'success', tick: state.tick },
          ...state.liveFeed
        ].slice(0, 50),
      };
    }


    case 'BUY_AUTO_PROCESS': {
      if (state.cash < 1000000 || state.autoProcess) return state;
      return {
        ...state,
        cash: state.cash - 1000000,
        totalExpenses: state.totalExpenses + 1000000,
        autoProcess: true,
        pendingOrders: 0,
        liveFeed: [
          { msg: '[UPGRADE] Auto-Process API aktif! Order otomatis diproses 🤖', type: 'success', tick: state.tick },
          ...state.liveFeed
        ].slice(0, 50),
      };
    }
    
    case 'PROCESS_ORDERS': {
      if (state.pendingOrders <= 0) return state;
      const processed = Math.min(state.pendingOrders, 10);
      return {
        ...state,
        pendingOrders: state.pendingOrders - processed,
        liveFeed: [
          { msg: `[MANUAL] ${processed} order diproses manual ✅`, type: 'info', tick: state.tick },
          ...state.liveFeed
        ].slice(0, 50),
      };
    }
    
    case 'BUY_MARKETING': {
      const { campaignId } = action.payload;
      const campaign = MARKETING_OPTIONS.find(c => c.id === campaignId);
      if (!campaign || state.cash < campaign.cost) return state;
      
      return {
        ...state,
        cash: state.cash - campaign.cost,
        totalExpenses: state.totalExpenses + campaign.cost,
        activeCampaigns: [...state.activeCampaigns, { ...campaign, remaining: campaign.duration }],
        liveFeed: [
          { msg: `[MARKETING] ${campaign.name} aktif! Traffic boost ${campaign.trafficBoost}x selama ${campaign.duration} tick 📈`, type: 'info', tick: state.tick },
          ...state.liveFeed
        ].slice(0, 50),
      };
    }


    case 'DISMISS_EVENT': {
      return { ...state, eventPopup: null };
    }
    
    case 'PAY_EVENT': {
      const event = state.eventPopup;
      if (!event || !event.cost) return { ...state, eventPopup: null };
      return {
        ...state,
        cash: state.cash - event.cost,
        totalExpenses: state.totalExpenses + event.cost,
        eventPopup: null,
        liveFeed: [
          { msg: `[EVENT] Bayar ${formatIDR(event.cost)} - masalah selesai 💸`, type: 'warning', tick: state.tick },
          ...state.liveFeed
        ].slice(0, 50),
      };
    }
    
    case 'IGNORE_EVENT': {
      const event = state.eventPopup;
      if (!event || !event.reputationHit) return { ...state, eventPopup: null };
      return {
        ...state,
        reputation: clamp(state.reputation - event.reputationHit, 0, 5),
        eventPopup: null,
        liveFeed: [
          { msg: `[EVENT] Masalah diabaikan - Reputasi -${event.reputationHit} ⭐`, type: 'error', tick: state.tick },
          ...state.liveFeed
        ].slice(0, 50),
      };
    }
    
    case 'TOGGLE_PAUSE': {
      return { ...state, isRunning: !state.isRunning };
    }
    
    case 'RESTART': {
      return { ...initialState };
    }
    
    default:
      return state;
  }
}


// ============ MAIN APP COMPONENT ============
export default function App() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Game tick loop
  useEffect(() => {
    if (!state.isRunning) return;
    const interval = setInterval(() => {
      dispatch({ type: 'TICK' });
    }, TICK_INTERVAL);
    return () => clearInterval(interval);
  }, [state.isRunning]);
  
  const serverLoad = useMemo(() => {
    const max = getServerMaxUsers(state.serverTier);
    return max > 0 ? (state.activeUsers / max) * 100 : 0;
  }, [state.activeUsers, state.serverTier]);
  
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'katalog', label: 'Katalog & Stok', icon: Package },
    { id: 'infra', label: 'Infrastruktur', icon: Server },
    { id: 'finance', label: 'Laporan Keuangan', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800/80 border-r border-slate-700 flex flex-col shrink-0">
        <div className="p-5 border-b border-slate-700">
          <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            🎮 Juragan TopUp
          </h1>
          <p className="text-xs text-slate-400 mt-1">Server Tycoon Simulator</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-700">
          <div className="text-xs text-slate-500">Hari {state.day} | Jam {String(state.hour).padStart(2, '0')}:00</div>
          <div className="text-xs text-slate-500">Tick #{state.tick}</div>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_PAUSE' })}
            className={`mt-2 w-full py-2 rounded text-xs font-bold ${state.isRunning ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'}`}
          >
            {state.isRunning ? '⏸ PAUSE' : '▶ RESUME'}
          </button>
        </div>
      </aside>


      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header - Global Stats */}
        <header className="bg-slate-800/60 border-b border-slate-700 px-6 py-3 flex items-center gap-6 flex-wrap">
          <StatBadge icon={DollarSign} label="Kas Tunai" value={formatIDR(state.cash)} color={state.cash > 0 ? 'text-green-400' : 'text-red-400'} />
          <StatBadge icon={Users} label="Active Users" value={state.activeUsers.toLocaleString()} color="text-cyan-400" pulse={state.activeUsers > 0} />
          <StatBadge icon={Activity} label="Server Load" value={`${serverLoad.toFixed(1)}%`} color={serverLoad > 80 ? 'text-red-400' : serverLoad > 50 ? 'text-yellow-400' : 'text-green-400'} />
          <StatBadge icon={Star} label="Reputasi" value={`${state.reputation.toFixed(1)} ⭐`} color="text-yellow-400" />
          {state.serverCrashed && (
            <span className="px-3 py-1 bg-red-900/50 border border-red-500 rounded text-red-400 text-xs font-bold animate-pulse">
              🔴 SERVER DOWN
            </span>
          )}
          {state.pendingOrders > 0 && !state.autoProcess && (
            <span className="px-3 py-1 bg-orange-900/50 border border-orange-500 rounded text-orange-400 text-xs font-bold">
              📋 {state.pendingOrders} Order Pending
            </span>
          )}
        </header>
        
        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6">
          {activeTab === 'dashboard' && <DashboardTab state={state} dispatch={dispatch} />}
          {activeTab === 'katalog' && <KatalogTab state={state} dispatch={dispatch} />}
          {activeTab === 'infra' && <InfraTab state={state} dispatch={dispatch} />}
          {activeTab === 'finance' && <FinanceTab state={state} />}
        </main>
      </div>
      
      {/* Event Popup Modal */}
      {state.eventPopup && <EventPopup event={state.eventPopup} dispatch={dispatch} cash={state.cash} />}
      
      {/* Game Over Modal */}
      {state.gameOver && <GameOverModal state={state} dispatch={dispatch} />}
    </div>
  );
}


// ============ SUB-COMPONENTS ============

function StatBadge({ icon: Icon, label, value, color, pulse }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Icon size={16} className={color} />
        {pulse && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full animate-pulse" />}
      </div>
      <div>
        <div className="text-[10px] text-slate-500 uppercase">{label}</div>
        <div className={`text-sm font-bold ${color}`}>{value}</div>
      </div>
    </div>
  );
}

// ============ DASHBOARD TAB ============
function DashboardTab({ state, dispatch }) {
  const maxTraffic = Math.max(...state.trafficHistory, 1);
  
  return (
    <div className="space-y-6">
      {/* Traffic Chart */}
      <div className="bg-slate-800/60 rounded-xl border border-slate-700 p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <TrendingUp size={16} className="text-cyan-400" /> Traffic Monitor (Last 24 Ticks)
        </h3>
        <div className="flex items-end gap-1 h-32">
          {state.trafficHistory.map((val, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
              <div
                className={`w-full rounded-t transition-all duration-300 ${
                  val / maxTraffic > 0.8 ? 'bg-gradient-to-t from-red-600 to-red-400' :
                  val / maxTraffic > 0.5 ? 'bg-gradient-to-t from-yellow-600 to-yellow-400' :
                  'bg-gradient-to-t from-cyan-600 to-cyan-400'
                }`}
                style={{ height: `${Math.max(2, (val / maxTraffic) * 100)}%` }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-slate-500">
          <span>-24 tick</span>
          <span>Sekarang</span>
        </div>
      </div>


      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickStat label="Revenue Total" value={formatIDR(state.totalRevenue)} icon={TrendingUp} color="text-green-400" />
        <QuickStat label="Expenses Total" value={formatIDR(state.totalExpenses)} icon={TrendingDown} color="text-red-400" />
        <QuickStat label="Net Profit" value={formatIDR(state.totalRevenue - state.totalExpenses)} icon={DollarSign} color={state.totalRevenue > state.totalExpenses ? 'text-green-400' : 'text-red-400'} />
        <QuickStat label="Auto Process" value={state.autoProcess ? 'ACTIVE' : 'MANUAL'} icon={Zap} color={state.autoProcess ? 'text-cyan-400' : 'text-orange-400'} />
      </div>
      
      {/* Manual Process Button */}
      {!state.autoProcess && state.pendingOrders > 0 && (
        <div className="bg-orange-900/20 border border-orange-500/30 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-orange-400 font-semibold">📋 {state.pendingOrders} Order Menunggu Proses</p>
            <p className="text-xs text-slate-400">Klik tombol untuk proses 10 order (atau beli Auto-Process API di tab Infrastruktur)</p>
          </div>
          <button
            onClick={() => dispatch({ type: 'PROCESS_ORDERS' })}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-sm font-bold transition-colors"
          >
            Proses Order
          </button>
        </div>
      )}
      
      {/* Live Feed */}
      <div className="bg-slate-800/60 rounded-xl border border-slate-700 p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <Monitor size={16} className="text-green-400" /> Live Transaction Feed
        </h3>
        <div className="bg-slate-900 rounded-lg p-3 h-48 overflow-y-auto font-mono text-xs space-y-1">
          {state.liveFeed.length === 0 ? (
            <p className="text-slate-600">Waiting for transactions...</p>
          ) : (
            state.liveFeed.map((item, i) => (
              <div key={i} className={`${
                item.type === 'success' ? 'text-green-400' :
                item.type === 'error' ? 'text-red-400' :
                item.type === 'warning' ? 'text-yellow-400' :
                'text-slate-400'
              }`}>
                {item.msg}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function QuickStat({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-slate-800/60 rounded-xl border border-slate-700 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className={color} />
        <span className="text-[11px] text-slate-500 uppercase">{label}</span>
      </div>
      <div className={`text-lg font-bold ${color}`}>{value}</div>
    </div>
  );
}


// ============ KATALOG TAB ============
function KatalogTab({ state, dispatch }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-200">📦 Katalog Produk & Manajemen Stok</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {PRODUCTS.map(prod => (
          <ProductCard key={prod.id} product={prod} data={state.products[prod.id]} cash={state.cash} dispatch={dispatch} />
        ))}
      </div>
    </div>
  );
}

function ProductCard({ product, data, cash, dispatch }) {
  const [buyAmount, setBuyAmount] = useState(1000);
  const [newPrice, setNewPrice] = useState(data.retailPrice);
  
  const totalCost = data.wholesalePrice * buyAmount;
  const marginPct = ((data.retailPrice - data.wholesalePrice) / data.wholesalePrice * 100).toFixed(1);
  const canAfford = cash >= totalCost;
  
  return (
    <div className="bg-slate-800/60 rounded-xl border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className={`bg-gradient-to-r ${product.color} p-4`}>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl mr-2">{product.icon}</span>
            <span className="text-lg font-bold">{product.name}</span>
          </div>
          <span className="text-sm opacity-80">{product.currency}</span>
        </div>
      </div>
      
      {/* Body */}
      <div className="p-4 space-y-4">
        {/* Stock Info */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-400">Stok Tersedia:</span>
          <span className={`font-bold ${data.stock < 500 ? 'text-red-400' : 'text-green-400'}`}>
            {data.stock.toLocaleString()} {product.currency}
          </span>
        </div>
        
        {/* Pricing */}
        <div className="bg-slate-900/50 rounded-lg p-3 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Harga Beli (per unit):</span>
            <span className="text-slate-300">{formatIDR(data.wholesalePrice)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Harga Jual (per {data.unitSize}):</span>
            <span className="text-cyan-400 font-bold">{formatIDR(data.retailPrice * data.unitSize)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Margin:</span>
            <span className={`font-bold ${parseFloat(marginPct) > 30 ? 'text-green-400' : parseFloat(marginPct) > 10 ? 'text-yellow-400' : 'text-red-400'}`}>
              {marginPct}%
            </span>
          </div>
        </div>


        {/* Buy Stock */}
        <div className="space-y-2">
          <label className="text-xs text-slate-400">Beli Stok dari Supplier VIP:</label>
          <div className="flex gap-2">
            <select
              value={buyAmount}
              onChange={e => setBuyAmount(Number(e.target.value))}
              className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm"
            >
              <option value={500}>500 unit</option>
              <option value={1000}>1.000 unit</option>
              <option value={5000}>5.000 unit</option>
              <option value={10000}>10.000 unit</option>
              <option value={50000}>50.000 unit</option>
            </select>
            <button
              onClick={() => dispatch({ type: 'BUY_STOCK', payload: { productId: product.id, amount: buyAmount } })}
              disabled={!canAfford}
              className={`px-4 py-2 rounded text-sm font-bold transition-colors ${
                canAfford ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-600 opacity-50 cursor-not-allowed'
              }`}
            >
              Beli ({formatIDR(totalCost)})
            </button>
          </div>
        </div>
        
        {/* Set Price */}
        <div className="space-y-2">
          <label className="text-xs text-slate-400">Set Harga Jual per unit:</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={newPrice}
              onChange={e => setNewPrice(Number(e.target.value))}
              className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm"
              min="1"
            />
            <button
              onClick={() => dispatch({ type: 'SET_PRICE', payload: { productId: product.id, price: newPrice } })}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded text-sm font-bold transition-colors"
            >
              Update
            </button>
          </div>
          <p className="text-[10px] text-slate-500">Harga pasar wajar: ~{formatIDR(Math.floor(data.wholesalePrice * 1.8))}/unit. Terlalu mahal = conversion turun.</p>
        </div>
      </div>
    </div>
  );
}


// ============ INFRASTRUKTUR TAB ============
function InfraTab({ state, dispatch }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-200">🖥️ Infrastruktur & Marketing</h2>
      
      {/* Server Upgrades */}
      <div className="bg-slate-800/60 rounded-xl border border-slate-700 p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <Cpu size={16} className="text-purple-400" /> Server Upgrades
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SERVER_TIERS.map(tier => {
            const isCurrent = state.serverTier === tier.id;
            const canBuy = !isCurrent && state.serverTier < tier.id && state.cash >= tier.price;
            const isPast = state.serverTier > tier.id;
            
            return (
              <div key={tier.id} className={`rounded-lg border p-4 ${
                isCurrent ? 'border-cyan-500 bg-cyan-900/20' :
                isPast ? 'border-slate-600 bg-slate-800/30 opacity-50' :
                'border-slate-600 bg-slate-800/50'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-sm">{tier.name}</h4>
                  {isCurrent && <span className="text-[10px] px-2 py-0.5 bg-cyan-500/30 text-cyan-400 rounded-full">ACTIVE</span>}
                </div>
                <p className="text-xs text-slate-400 mb-2">{tier.desc}</p>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Max Users:</span>
                    <span className="text-slate-300">{tier.maxUsers.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Biaya/tick:</span>
                    <span className="text-slate-300">{formatIDR(tier.costPerTick)}</span>
                  </div>
                  {tier.price > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Harga Upgrade:</span>
                      <span className="text-yellow-400 font-bold">{formatIDR(tier.price)}</span>
                    </div>
                  )}
                </div>
                {!isCurrent && !isPast && (
                  <button
                    onClick={() => dispatch({ type: 'UPGRADE_SERVER', payload: { tierId: tier.id } })}
                    disabled={!canBuy}
                    className={`mt-3 w-full py-2 rounded text-xs font-bold transition-colors ${
                      canBuy ? 'bg-purple-600 hover:bg-purple-700' : 'bg-slate-600 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    {canBuy ? 'UPGRADE' : state.cash < tier.price ? 'Dana Kurang' : 'Locked'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>


      {/* Auto Process API */}
      <div className="bg-slate-800/60 rounded-xl border border-slate-700 p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <Zap size={16} className="text-yellow-400" /> API Auto-Process System
        </h3>
        {state.autoProcess ? (
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 text-center">
            <CheckCircle size={32} className="text-green-400 mx-auto mb-2" />
            <p className="text-green-400 font-bold">Auto-Process API Aktif!</p>
            <p className="text-xs text-slate-400 mt-1">Semua order diproses otomatis tanpa delay</p>
          </div>
        ) : (
          <div className="bg-slate-900/50 rounded-lg p-4">
            <p className="text-sm text-slate-300 mb-3">
              Tanpa API, kamu harus proses order manual setiap 10 order.
              Upgrade ke Auto-Process untuk mengotomasi semua transaksi.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-yellow-400 font-bold">{formatIDR(1000000)}</span>
              <button
                onClick={() => dispatch({ type: 'BUY_AUTO_PROCESS' })}
                disabled={state.cash < 1000000}
                className={`px-6 py-2 rounded text-sm font-bold transition-colors ${
                  state.cash >= 1000000 ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-slate-600 opacity-50 cursor-not-allowed'
                }`}
              >
                Beli Auto-Process API
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Marketing */}
      <div className="bg-slate-800/60 rounded-xl border border-slate-700 p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <Megaphone size={16} className="text-pink-400" /> Marketing & Ads
        </h3>
        
        {/* Active Campaigns */}
        {state.activeCampaigns.length > 0 && (
          <div className="mb-4 space-y-2">
            <p className="text-xs text-slate-400 uppercase">Campaign Aktif:</p>
            {state.activeCampaigns.map((c, i) => (
              <div key={i} className="flex items-center justify-between bg-green-900/20 border border-green-500/20 rounded-lg px-3 py-2">
                <span className="text-sm text-green-400">{c.icon} {c.name}</span>
                <span className="text-xs text-slate-400">{c.remaining} tick tersisa | {c.trafficBoost}x boost</span>
              </div>
            ))}
          </div>
        )}


        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {MARKETING_OPTIONS.map(opt => (
            <div key={opt.id} className="bg-slate-900/50 rounded-lg border border-slate-600 p-4">
              <div className="text-center mb-3">
                <span className="text-3xl">{opt.icon}</span>
                <h4 className="font-bold text-sm mt-2">{opt.name}</h4>
              </div>
              <div className="text-xs space-y-1 mb-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Durasi:</span>
                  <span className="text-slate-300">{opt.duration} tick</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Traffic Boost:</span>
                  <span className="text-cyan-400">{opt.trafficBoost}x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Biaya:</span>
                  <span className="text-yellow-400">{formatIDR(opt.cost)}</span>
                </div>
              </div>
              <button
                onClick={() => dispatch({ type: 'BUY_MARKETING', payload: { campaignId: opt.id } })}
                disabled={state.cash < opt.cost}
                className={`w-full py-2 rounded text-xs font-bold transition-colors ${
                  state.cash >= opt.cost ? 'bg-pink-600 hover:bg-pink-700' : 'bg-slate-600 opacity-50 cursor-not-allowed'
                }`}
              >
                Pasang Iklan
              </button>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-slate-500 mt-3">⚠️ Hati-hati! Marketing boost traffic drastis. Pastikan server cukup kuat!</p>
      </div>
    </div>
  );
}


// ============ FINANCE TAB ============
function FinanceTab({ state }) {
  const netProfit = state.totalRevenue - state.totalExpenses;
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-200">📊 Laporan Keuangan</h2>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/60 rounded-xl border border-slate-700 p-5">
          <div className="text-xs text-slate-500 uppercase mb-1">Total Revenue</div>
          <div className="text-2xl font-bold text-green-400">{formatIDR(state.totalRevenue)}</div>
        </div>
        <div className="bg-slate-800/60 rounded-xl border border-slate-700 p-5">
          <div className="text-xs text-slate-500 uppercase mb-1">Total Expenses</div>
          <div className="text-2xl font-bold text-red-400">{formatIDR(state.totalExpenses)}</div>
        </div>
        <div className="bg-slate-800/60 rounded-xl border border-slate-700 p-5">
          <div className="text-xs text-slate-500 uppercase mb-1">Net Profit</div>
          <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatIDR(netProfit)}
          </div>
        </div>
      </div>
      
      {/* Current Assets */}
      <div className="bg-slate-800/60 rounded-xl border border-slate-700 p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">💰 Aset & Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-slate-500 text-xs">Kas Tunai</span>
            <p className="font-bold text-green-400">{formatIDR(state.cash)}</p>
          </div>
          <div>
            <span className="text-slate-500 text-xs">Server Tier</span>
            <p className="font-bold text-purple-400">{SERVER_TIERS.find(s => s.id === state.serverTier)?.name}</p>
          </div>
          <div>
            <span className="text-slate-500 text-xs">Auto-Process</span>
            <p className={`font-bold ${state.autoProcess ? 'text-cyan-400' : 'text-orange-400'}`}>
              {state.autoProcess ? 'Aktif' : 'Manual'}
            </p>
          </div>
          <div>
            <span className="text-slate-500 text-xs">Reputasi</span>
            <p className="font-bold text-yellow-400">{state.reputation.toFixed(2)} / 5.00</p>
          </div>
        </div>
      </div>


      {/* Stock Values */}
      <div className="bg-slate-800/60 rounded-xl border border-slate-700 p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">📦 Nilai Stok</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-500 border-b border-slate-700">
              <th className="text-left py-2">Produk</th>
              <th className="text-right py-2">Stok</th>
              <th className="text-right py-2">Harga Beli/unit</th>
              <th className="text-right py-2">Harga Jual/unit</th>
              <th className="text-right py-2">Nilai Stok</th>
              <th className="text-right py-2">Margin</th>
            </tr>
          </thead>
          <tbody>
            {PRODUCTS.map(prod => {
              const data = state.products[prod.id];
              const stockValue = data.stock * data.wholesalePrice;
              const margin = ((data.retailPrice - data.wholesalePrice) / data.wholesalePrice * 100).toFixed(1);
              return (
                <tr key={prod.id} className="border-b border-slate-700/50">
                  <td className="py-2">{prod.icon} {prod.name}</td>
                  <td className="text-right text-slate-300">{data.stock.toLocaleString()}</td>
                  <td className="text-right text-slate-400">{formatIDR(data.wholesalePrice)}</td>
                  <td className="text-right text-cyan-400">{formatIDR(data.retailPrice)}</td>
                  <td className="text-right text-yellow-400">{formatIDR(stockValue)}</td>
                  <td className={`text-right font-bold ${parseFloat(margin) > 30 ? 'text-green-400' : parseFloat(margin) > 10 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {margin}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Finance History */}
      <div className="bg-slate-800/60 rounded-xl border border-slate-700 p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">📈 Riwayat Harian</h3>
        {state.financeLog.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">Data akan muncul setelah hari pertama selesai (24 tick)</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-slate-700">
                <th className="text-left py-2">Hari</th>
                <th className="text-right py-2">Revenue</th>
                <th className="text-right py-2">Expenses</th>
                <th className="text-right py-2">Net Profit</th>
              </tr>
            </thead>
            <tbody>
              {state.financeLog.map((entry, i) => (
                <tr key={i} className="border-b border-slate-700/50">
                  <td className="py-2">Hari {entry.day}</td>
                  <td className="text-right text-green-400">{formatIDR(entry.revenue)}</td>
                  <td className="text-right text-red-400">{formatIDR(entry.expenses)}</td>
                  <td className={`text-right font-bold ${entry.net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatIDR(entry.net)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}


// ============ EVENT POPUP ============
function EventPopup({ event, dispatch, cash }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-600 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-bounce-in">
        <h3 className="text-xl font-bold text-white mb-3">{event.title}</h3>
        <p className="text-sm text-slate-300 mb-5">{event.desc}</p>
        
        <div className="flex gap-3">
          {event.cost ? (
            <>
              <button
                onClick={() => dispatch({ type: 'PAY_EVENT' })}
                disabled={cash < event.cost}
                className={`flex-1 py-3 rounded-lg font-bold text-sm transition-colors ${
                  cash >= event.cost ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-600 opacity-50 cursor-not-allowed'
                }`}
              >
                💰 Bayar {formatIDR(event.cost)}
              </button>
              <button
                onClick={() => dispatch({ type: 'IGNORE_EVENT' })}
                className="flex-1 py-3 rounded-lg font-bold text-sm bg-red-600 hover:bg-red-700 transition-colors"
              >
                ❌ Abaikan (-{event.reputationHit} ⭐)
              </button>
            </>
          ) : (
            <button
              onClick={() => dispatch({ type: 'DISMISS_EVENT' })}
              className="flex-1 py-3 rounded-lg font-bold text-sm bg-cyan-600 hover:bg-cyan-700 transition-colors"
            >
              OK, Saya Mengerti
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============ GAME OVER MODAL ============
function GameOverModal({ state, dispatch }) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-red-500 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
        <div className="text-6xl mb-4">💀</div>
        <h2 className="text-2xl font-bold text-red-400 mb-3">BANGKRUT!</h2>
        <p className="text-slate-300 mb-2">Website topup kamu gulung tikar.</p>
        <p className="text-sm text-slate-500 mb-6">
          Bertahan selama {state.day} hari dengan total revenue {formatIDR(state.totalRevenue)}.
        </p>
        <button
          onClick={() => dispatch({ type: 'RESTART' })}
          className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-lg font-bold text-white hover:opacity-90 transition-opacity"
        >
          🔄 Main Lagi
        </button>
      </div>
    </div>
  );
}
