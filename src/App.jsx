import React, { useReducer, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  LayoutDashboard, Package, Server, FileText, Users, Activity,
  Star, DollarSign, TrendingUp, TrendingDown, ShoppingCart,
  Zap, AlertTriangle, CheckCircle, XCircle, Wifi, WifiOff,
  ChevronRight, ArrowUp, Volume2, Megaphone, Monitor, Cloud,
  Database, Cpu, Globe, X, Briefcase, Building2, Rocket,
  UserPlus, Shield, Search, CreditCard, Play, RotateCcw
} from 'lucide-react';

// ============ CONSTANTS ============
const TICK_INTERVAL = 2000;
const STARTING_CASH = 10000000;
const TICKS_PER_DAY = 24;
const SAVE_KEY = 'juragantopup_save_v2';

const PRODUCTS = [
  { id: 'mobillejen', name: 'Mobil Lejen', currency: 'Diamonds', icon: '💎', color: 'from-blue-500 to-purple-600', marketBase: 270 },
  { id: 'frifayer', name: 'Fri Fayer', currency: 'DM', icon: '🔥', color: 'from-orange-500 to-red-600', marketBase: 220 },
  { id: 'valoran', name: 'Valoran', currency: 'VP', icon: '⚡', color: 'from-cyan-500 to-blue-600', marketBase: 320 },
  { id: 'pabji', name: 'Pabji', currency: 'UC', icon: '🎯', color: 'from-green-500 to-emerald-600', marketBase: 360 },
  { id: 'gensin', name: 'Gensin Impek', currency: 'Genesis Crystal', icon: '🌟', color: 'from-yellow-500 to-amber-600', marketBase: 400 },
];

const SERVER_TIERS = [
  { id: 1, name: 'Shared Hosting', maxUsers: 500, costPerTick: 5000, price: 0, desc: 'Hosting ala kadarnya', uptime: 90 },
  { id: 2, name: 'VPS Standar', maxUsers: 2000, costPerTick: 25000, price: 500000, desc: 'Virtual Private Server', uptime: 95 },
  { id: 3, name: 'Cloud AWS', maxUsers: 8000, costPerTick: 100000, price: 2000000, desc: 'Auto-scaling cloud', uptime: 99 },
  { id: 4, name: 'Dedicated Server', maxUsers: 25000, costPerTick: 350000, price: 8000000, desc: 'Server pribadi full power', uptime: 99.5 },
  { id: 5, name: 'Multi-Region Cluster', maxUsers: 100000, costPerTick: 1000000, price: 50000000, desc: 'Global infrastructure', uptime: 99.9 },
];

const MARKETING_OPTIONS = [
  { id: 'tiktok', name: 'TikTok Ads', cost: 300000, duration: 15, trafficBoost: 2.5, icon: '🎵' },
  { id: 'instagram', name: 'IG Ads', cost: 500000, duration: 20, trafficBoost: 3.0, icon: '📸' },
  { id: 'google', name: 'Google Ads', cost: 800000, duration: 25, trafficBoost: 3.5, icon: '🔍' },
  { id: 'proplayer', name: 'Sponsor Pro Player', cost: 1500000, duration: 30, trafficBoost: 5.0, icon: '🏆' },
  { id: 'youtuber', name: 'Endorse YouTuber', cost: 3000000, duration: 40, trafficBoost: 7.0, icon: '📺' },
];


const EMPLOYEES = [
  { id: 'cs', name: 'Customer Service (CS)', salary: 150000, desc: 'Mengurangi dampak reputasi negatif saat order gagal', icon: '🎧', effect: 'reputation_shield' },
  { id: 'devops', name: 'DevOps Engineer', salary: 350000, desc: 'Server crash recovery 3 tick → 1 tick. Auto-restart.', icon: '🛠️', effect: 'crash_recovery' },
  { id: 'seo', name: 'SEO Specialist', salary: 250000, desc: 'Meningkatkan Domain Authority +0.5/hari → traffic organik naik', icon: '🔎', effect: 'seo_boost' },
  { id: 'finance', name: 'Finance Manager', salary: 200000, desc: 'Mengurangi MDR fee sebesar 20%', icon: '💰', effect: 'fee_reduction' },
  { id: 'marketing', name: 'Marketing Lead', salary: 300000, desc: 'Campaign duration +50% lebih lama', icon: '📢', effect: 'campaign_extend' },
];

const FUNDING_TIERS = [
  { id: 'angel', name: 'Angel Investor', amount: 100000000, equityTaken: 10, requirements: { mrr: 5000000, users: 500, uptime: 90 }, desc: 'Investor angel yang percaya visi kamu' },
  { id: 'seed', name: 'Seed Funding', amount: 500000000, equityTaken: 20, requirements: { mrr: 20000000, users: 2000, uptime: 95 }, desc: 'VC tahap awal untuk scale-up' },
  { id: 'seriesA', name: 'Series A', amount: 2000000000, equityTaken: 25, requirements: { mrr: 100000000, users: 10000, uptime: 99 }, desc: 'Pendanaan besar untuk ekspansi nasional' },
  { id: 'seriesB', name: 'Series B', amount: 10000000000, equityTaken: 20, requirements: { mrr: 500000000, users: 50000, uptime: 99.5 }, desc: 'Unicorn-level funding' },
];

const PAYMENT_GATEWAYS = [
  { id: 'qris', name: 'QRIS', feeType: 'percentage', fee: 0.7, icon: '📱' },
  { id: 'va', name: 'Virtual Account', feeType: 'flat', fee: 4000, icon: '🏦' },
  { id: 'ewallet', name: 'E-Wallet (OVO/DANA)', feeType: 'percentage', fee: 1.5, icon: '💳' },
  { id: 'cc', name: 'Credit Card', feeType: 'percentage', fee: 2.9, icon: '💎' },
];

const RANDOM_EVENTS = [
  { id: 'maintenance', title: '🔧 Server Game Pusat Maintenance!', desc: 'Server game pusat maintenance. Topup gagal selama 5 tick!', effect: 'maintenance', duration: 5 },
  { id: 'influencer', title: '🌟 Influencer Review!', desc: 'YouTuber terkenal mereview website kamu! Traffic +500%!', effect: 'trafficSpike', duration: 8 },
  { id: 'bocil', title: '😤 Bocil Nyepam CS!', desc: '"DIAMOND GW MANA WOI!!!" Bayar Rp 200.000 atau reputasi turun!', effect: 'bocilComplaint', cost: 200000, reputationHit: 0.3 },
  { id: 'promo', title: '🎉 Hari Besar Nasional!', desc: 'Traffic meningkat karena libur nasional! +300% selama 10 tick!', effect: 'holiday', duration: 10 },
  { id: 'competitor', title: '⚔️ Kompetitor Perang Harga!', desc: 'Kompetitor turunkan harga! Conversion turun 50% selama 8 tick!', effect: 'priceWar', duration: 8 },
  { id: 'ddos', title: '🏴‍☠️ DDoS Attack!', desc: 'Website kena serangan DDoS! Server crash selama 4 tick!', effect: 'ddos', duration: 4 },
  { id: 'viral', title: '🚀 Thread Viral di Twitter!', desc: 'Website kamu viral! User baru membanjir +400% traffic!', effect: 'trafficSpike', duration: 6 },
];


// ============ INITIAL STATE ============
const createInitialState = (companyName = '', domainName = '') => ({
  companyName,
  domainName,
  cash: STARTING_CASH,
  tick: 0,
  day: 1,
  hour: 0,
  reputation: 3.5,
  activeUsers: 0,
  totalUsers: 0,
  serverTier: 1,
  serverCrashed: false,
  serverCrashTicks: 0,
  autoProcess: false,
  pendingOrders: 0,
  totalRevenue: 0,
  totalExpenses: 0,
  todayRevenue: 0,
  todayExpenses: 0,
  domainAuthority: 5,
  equity: 100,
  fundingStage: 'bootstrapping',
  fundingHistory: [],
  products: {
    mobillejen: { stock: 0, wholesalePrice: 150, retailPrice: 250, unitSize: 100 },
    frifayer: { stock: 0, wholesalePrice: 120, retailPrice: 200, unitSize: 100 },
    valoran: { stock: 0, wholesalePrice: 180, retailPrice: 300, unitSize: 100 },
    pabji: { stock: 0, wholesalePrice: 200, retailPrice: 330, unitSize: 100 },
    gensin: { stock: 0, wholesalePrice: 220, retailPrice: 380, unitSize: 100 },
  },
  employees: { cs: 0, devops: 0, seo: 0, finance: 0, marketing: 0 },
  activeCampaigns: [],
  activeEvents: [],
  trafficHistory: Array(24).fill(0),
  revenueHistory: Array(30).fill(0),
  liveFeed: [],
  financeLog: [],
  isRunning: true,
  gameOver: false,
  eventPopup: null,
  ticksSinceEvent: 0,
  toast: null,
  totalTransactions: 0,
  totalOrdersFailed: 0,
  pgFeesTotal: 0,
});

// ============ HELPER FUNCTIONS ============
const formatIDR = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
const getServerMaxUsers = (tier) => SERVER_TIERS.find(s => s.id === tier)?.maxUsers || 500;
const getServerCost = (tier) => SERVER_TIERS.find(s => s.id === tier)?.costPerTick || 5000;
const getServerUptime = (tier) => SERVER_TIERS.find(s => s.id === tier)?.uptime || 90;

const calculateMRR = (state) => {
  const avgDailyRevenue = state.day > 1 ? state.totalRevenue / (state.day - 1) : state.todayRevenue;
  return avgDailyRevenue * 30;
};

const calculateValuation = (state) => {
  const avgDailyProfit = state.day > 1 ? (state.totalRevenue - state.totalExpenses) / (state.day - 1) : 0;
  const multiplier = state.fundingStage === 'bootstrapping' ? 8 : state.fundingStage === 'angel' ? 12 : state.fundingStage === 'seed' ? 20 : state.fundingStage === 'seriesA' ? 35 : 50;
  return Math.max(0, avgDailyProfit * 30 * 12 * multiplier);
};


// ============ REDUCER ============
function gameReducer(state, action) {
  switch (action.type) {
    case 'LOAD_STATE': return { ...action.payload, isRunning: true, eventPopup: null, toast: null };

    case 'TICK': {
      if (!state.isRunning || state.gameOver) return state;
      let s = { ...state, tick: state.tick + 1, toast: null };
      s.hour = (s.hour + 1) % TICKS_PER_DAY;
      s.ticksSinceEvent += 1;

      // New day
      if (s.hour === 0) {
        s.day += 1;
        s.revenueHistory = [...s.revenueHistory.slice(1), s.todayRevenue];
        s.financeLog = [{ day: s.day - 1, revenue: s.todayRevenue, expenses: s.todayExpenses, net: s.todayRevenue - s.todayExpenses }, ...s.financeLog].slice(0, 60);
        s.todayRevenue = 0;
        s.todayExpenses = 0;
        // SEO boost from specialist
        if (s.employees.seo > 0) {
          s.domainAuthority = Math.min(100, s.domainAuthority + 0.5 * s.employees.seo);
        }
        // Auto-save every day
        s.toast = { msg: '💾 Game Saved!', type: 'success' };
      }

      // Campaign durations
      const marketingLead = s.employees.marketing;
      s.activeCampaigns = s.activeCampaigns.map(c => ({ ...c, remaining: c.remaining - 1 })).filter(c => c.remaining > 0);
      // Event durations
      s.activeEvents = s.activeEvents.map(e => ({ ...e, remaining: e.remaining - 1 })).filter(e => e.remaining > 0);

      // Server crash recovery
      if (s.serverCrashed) {
        s.serverCrashTicks += 1;
        const recoveryTime = s.employees.devops > 0 ? 1 : 10;
        if (s.serverCrashTicks >= recoveryTime) {
          s.serverCrashed = false;
          s.serverCrashTicks = 0;
          s.liveFeed = [{ msg: `[RECOVERY] Server kembali online! ${s.employees.devops > 0 ? '(DevOps auto-restart)' : ''} 🟢`, type: 'success', tick: s.tick }, ...s.liveFeed].slice(0, 50);
        } else {
          s.activeUsers = 0;
          s.trafficHistory = [...s.trafficHistory.slice(1), 0];
          // Still pay costs
          const serverCost = getServerCost(s.serverTier);
          const salaryCost = Object.entries(s.employees).reduce((sum, [id, count]) => sum + (EMPLOYEES.find(e => e.id === id)?.salary || 0) * count, 0);
          s.cash -= (serverCost + salaryCost);
          s.totalExpenses += (serverCost + salaryCost);
          s.todayExpenses += (serverCost + salaryCost);
          return s;
        }
      }

      // DDoS event causes crash
      const hasDdos = s.activeEvents.find(e => e.effect === 'ddos');
      if (hasDdos && !s.serverCrashed) {
        s.serverCrashed = true;
        s.serverCrashTicks = 0;
        s.liveFeed = [{ msg: '[CRITICAL] 🏴‍☠️ DDoS Attack! Server DOWN!', type: 'error', tick: s.tick }, ...s.liveFeed].slice(0, 50);
      }

      // === TRAFFIC ===
      const baseTraffic = 50 + (s.reputation * 80) + (s.domainAuthority * 3);
      const timeMultiplier = (s.hour >= 18 && s.hour <= 23) ? 2.2 : (s.hour >= 12 && s.hour <= 17) ? 1.5 : (s.hour >= 7 && s.hour <= 11) ? 1.0 : 0.4;
      let campaignBoost = 1;
      s.activeCampaigns.forEach(c => { campaignBoost += (c.trafficBoost - 1); });
      let eventMultiplier = 1;
      if (s.activeEvents.find(e => e.effect === 'trafficSpike')) eventMultiplier *= 5;
      if (s.activeEvents.find(e => e.effect === 'holiday')) eventMultiplier *= 3;
      const randomFactor = 0.7 + Math.random() * 0.6;
      s.activeUsers = Math.max(0, Math.floor(baseTraffic * timeMultiplier * campaignBoost * eventMultiplier * randomFactor));
      s.totalUsers = Math.max(s.totalUsers, s.activeUsers);

      // === SERVER LOAD ===
      const maxUsers = getServerMaxUsers(s.serverTier);
      if (s.activeUsers > maxUsers) {
        s.serverCrashed = true;
        s.serverCrashTicks = 0;
        const repHit = s.employees.cs > 0 ? 0.2 : 0.5;
        s.reputation = clamp(s.reputation - repHit, 0, 5);
        s.activeUsers = 0;
        s.liveFeed = [{ msg: `[CRITICAL] 🔴 502 BAD GATEWAY - Server overload! Reputasi -${repHit} ⭐`, type: 'error', tick: s.tick }, ...s.liveFeed].slice(0, 50);
        s.trafficHistory = [...s.trafficHistory.slice(1), 0];
        return s;
      }


      // === ORDERS ===
      const hasMaintenance = s.activeEvents.find(e => e.effect === 'maintenance');
      const hasPriceWar = s.activeEvents.find(e => e.effect === 'priceWar');

      if (!hasMaintenance && !s.serverCrashed) {
        let baseConversion = 0.08 + (s.reputation - 3) * 0.02;
        if (hasPriceWar) baseConversion *= 0.5;
        const conversionRate = clamp(baseConversion, 0.02, 0.20);
        const numOrders = Math.floor(s.activeUsers * conversionRate);
        let ordersProcessed = 0;
        let ordersFailed = 0;
        let revenue = 0;
        let pgFees = 0;
        const newFeed = [];

        for (let i = 0; i < numOrders; i++) {
          const prodKey = Object.keys(s.products)[Math.floor(Math.random() * Object.keys(s.products).length)];
          const prod = s.products[prodKey];
          const prodInfo = PRODUCTS.find(p => p.id === prodKey);

          // Competitor price check - market price from PRODUCTS constant
          const marketPrice = prodInfo.marketBase;
          const playerPricePerUnit = prod.retailPrice;
          const priceRatio = playerPricePerUnit / marketPrice;

          // If player price > 10% above market, conversion drops to near 0
          if (priceRatio > 1.1) {
            const penaltyChance = Math.min(0.95, (priceRatio - 1.0) * 5);
            if (Math.random() < penaltyChance) continue;
          }

          if (prod.stock < prod.unitSize) {
            ordersFailed++;
            const repHit = s.employees.cs > 0 ? 0.005 : 0.02;
            s.reputation = clamp(s.reputation - repHit, 0, 5);
            if (i < 2) newFeed.push({ msg: `[FAILED] Out of Stock: ${prod.unitSize} ${prodInfo.currency} ${prodInfo.name}`, type: 'error', tick: s.tick });
          } else {
            if (s.autoProcess || s.pendingOrders < 10) {
              s.products = { ...s.products, [prodKey]: { ...prod, stock: prod.stock - prod.unitSize } };
              const orderRevenue = prod.retailPrice * prod.unitSize;

              // Payment Gateway Fee
              const pg = PAYMENT_GATEWAYS[Math.floor(Math.random() * PAYMENT_GATEWAYS.length)];
              let fee = pg.feeType === 'percentage' ? orderRevenue * (pg.fee / 100) : pg.fee;
              if (s.employees.finance > 0) fee *= 0.8; // Finance manager reduces fees
              pgFees += fee;

              const netRevenue = orderRevenue - fee;
              revenue += netRevenue;
              ordersProcessed++;
              s.totalTransactions++;

              if (i < 2) {
                const username = `User${Math.floor(Math.random() * 9999)}`;
                newFeed.push({ msg: `[SUCCESS] ${username} beli ${prod.unitSize} ${prodInfo.currency} ${prodInfo.name} via ${pg.name} - ${formatIDR(netRevenue)}`, type: 'success', tick: s.tick });
              }
            } else {
              s.pendingOrders += 1;
            }
          }
        }

        if (ordersFailed > 2) newFeed.push({ msg: `[WARNING] ${ordersFailed} order gagal (stok habis)!`, type: 'warning', tick: s.tick });

        s.cash += revenue;
        s.totalRevenue += revenue;
        s.todayRevenue += revenue;
        s.pgFeesTotal += pgFees;
        s.totalOrdersFailed += ordersFailed;
        s.reputation = clamp(s.reputation + (ordersProcessed * 0.003), 0, 5);
        s.liveFeed = [...newFeed, ...s.liveFeed].slice(0, 50);
      } else if (hasMaintenance) {
        s.liveFeed = [{ msg: '[MAINTENANCE] ⚠️ Server game pusat maintenance - topup gagal!', type: 'warning', tick: s.tick }, ...s.liveFeed].slice(0, 50);
      }

      // === COSTS ===
      const serverCost = getServerCost(s.serverTier);
      const salaryCost = Object.entries(s.employees).reduce((sum, [id, count]) => sum + (EMPLOYEES.find(e => e.id === id)?.salary || 0) * count, 0);
      const totalCost = serverCost + salaryCost;
      s.cash -= totalCost;
      s.totalExpenses += totalCost;
      s.todayExpenses += totalCost;

      // === TRAFFIC HISTORY ===
      s.trafficHistory = [...s.trafficHistory.slice(1), s.activeUsers];

      // === RANDOM EVENTS ===
      if (s.ticksSinceEvent >= 12 && Math.random() < 0.12) {
        const event = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
        s.ticksSinceEvent = 0;
        s.eventPopup = event;
        if (event.duration) {
          s.activeEvents = [...s.activeEvents, { ...event, remaining: event.duration }];
        }
      }

      // === GAME OVER ===
      if (s.cash < -5000000) {
        s.gameOver = true;
        s.isRunning = false;
      }

      return s;
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
        todayExpenses: state.todayExpenses + totalCost,
        products: { ...state.products, [productId]: { ...prod, stock: prod.stock + amount } },
        liveFeed: [{ msg: `[STOCK] Beli ${amount.toLocaleString()} unit ${PRODUCTS.find(p => p.id === productId)?.name} - ${formatIDR(totalCost)}`, type: 'info', tick: state.tick }, ...state.liveFeed].slice(0, 50),
      };
    }

    case 'SET_PRICE': {
      const { productId, price } = action.payload;
      return { ...state, products: { ...state.products, [productId]: { ...state.products[productId], retailPrice: Math.max(1, price) } } };
    }

    case 'UPGRADE_SERVER': {
      const { tierId } = action.payload;
      const tier = SERVER_TIERS.find(s => s.id === tierId);
      if (!tier || state.cash < tier.price || state.serverTier >= tierId) return state;
      return {
        ...state,
        cash: state.cash - tier.price,
        totalExpenses: state.totalExpenses + tier.price,
        todayExpenses: state.todayExpenses + tier.price,
        serverTier: tierId,
        serverCrashed: false,
        serverCrashTicks: 0,
        liveFeed: [{ msg: `[UPGRADE] Server → ${tier.name}! Max ${tier.maxUsers.toLocaleString()} users 🚀`, type: 'success', tick: state.tick }, ...state.liveFeed].slice(0, 50),
      };
    }

    case 'BUY_AUTO_PROCESS': {
      if (state.cash < 1000000 || state.autoProcess) return state;
      return {
        ...state, cash: state.cash - 1000000, totalExpenses: state.totalExpenses + 1000000, todayExpenses: state.todayExpenses + 1000000, autoProcess: true, pendingOrders: 0,
        liveFeed: [{ msg: '[UPGRADE] Auto-Process API aktif! 🤖', type: 'success', tick: state.tick }, ...state.liveFeed].slice(0, 50),
      };
    }

    case 'PROCESS_ORDERS': {
      if (state.pendingOrders <= 0) return state;
      const processed = Math.min(state.pendingOrders, 10);
      return { ...state, pendingOrders: state.pendingOrders - processed, liveFeed: [{ msg: `[MANUAL] ${processed} order diproses ✅`, type: 'info', tick: state.tick }, ...state.liveFeed].slice(0, 50) };
    }

    case 'BUY_MARKETING': {
      const { campaignId } = action.payload;
      const campaign = MARKETING_OPTIONS.find(c => c.id === campaignId);
      if (!campaign || state.cash < campaign.cost) return state;
      const duration = state.employees.marketing > 0 ? Math.floor(campaign.duration * 1.5) : campaign.duration;
      return {
        ...state, cash: state.cash - campaign.cost, totalExpenses: state.totalExpenses + campaign.cost, todayExpenses: state.todayExpenses + campaign.cost,
        activeCampaigns: [...state.activeCampaigns, { ...campaign, remaining: duration }],
        liveFeed: [{ msg: `[MARKETING] ${campaign.name} aktif! ${campaign.trafficBoost}x boost 📈`, type: 'info', tick: state.tick }, ...state.liveFeed].slice(0, 50),
      };
    }

    case 'HIRE_EMPLOYEE': {
      const { employeeId } = action.payload;
      const emp = EMPLOYEES.find(e => e.id === employeeId);
      if (!emp) return state;
      const hireCost = emp.salary * 5;
      if (state.cash < hireCost) return state;
      return {
        ...state, cash: state.cash - hireCost, totalExpenses: state.totalExpenses + hireCost, todayExpenses: state.todayExpenses + hireCost,
        employees: { ...state.employees, [employeeId]: (state.employees[employeeId] || 0) + 1 },
        liveFeed: [{ msg: `[HRD] Hired ${emp.name}! Salary: ${formatIDR(emp.salary)}/tick 👤`, type: 'success', tick: state.tick }, ...state.liveFeed].slice(0, 50),
      };
    }

    case 'FIRE_EMPLOYEE': {
      const { employeeId } = action.payload;
      if (!state.employees[employeeId] || state.employees[employeeId] <= 0) return state;
      const emp = EMPLOYEES.find(e => e.id === employeeId);
      const severance = emp.salary * 3;
      return {
        ...state, cash: state.cash - severance, totalExpenses: state.totalExpenses + severance,
        employees: { ...state.employees, [employeeId]: state.employees[employeeId] - 1 },
        liveFeed: [{ msg: `[HRD] ${emp.name} dipecat. Pesangon: ${formatIDR(severance)} 👋`, type: 'warning', tick: state.tick }, ...state.liveFeed].slice(0, 50),
      };
    }


    case 'PITCH_VC': {
      const { fundingId } = action.payload;
      const tier = FUNDING_TIERS.find(f => f.id === fundingId);
      if (!tier) return state;
      const mrr = calculateMRR(state);
      const uptime = getServerUptime(state.serverTier);
      const meetsRequirements = mrr >= tier.requirements.mrr && state.totalUsers >= tier.requirements.users && uptime >= tier.requirements.uptime;
      if (!meetsRequirements) {
        return { ...state, liveFeed: [{ msg: `[VC] ❌ Pitch DITOLAK! Metrics belum memenuhi syarat.`, type: 'error', tick: state.tick }, ...state.liveFeed].slice(0, 50) };
      }
      // Check if already got this tier
      if (state.fundingHistory.includes(fundingId)) {
        return { ...state, liveFeed: [{ msg: `[VC] ⚠️ Sudah pernah mendapat ${tier.name}!`, type: 'warning', tick: state.tick }, ...state.liveFeed].slice(0, 50) };
      }
      return {
        ...state,
        cash: state.cash + tier.amount,
        equity: state.equity - tier.equityTaken,
        fundingStage: fundingId,
        fundingHistory: [...state.fundingHistory, fundingId],
        liveFeed: [{ msg: `[VC] 🎉 ${tier.name} BERHASIL! +${formatIDR(tier.amount)} | Equity: -${tier.equityTaken}%`, type: 'success', tick: state.tick }, ...state.liveFeed].slice(0, 50),
      };
    }

    case 'DISMISS_EVENT': return { ...state, eventPopup: null };

    case 'PAY_EVENT': {
      const event = state.eventPopup;
      if (!event?.cost) return { ...state, eventPopup: null };
      return {
        ...state, cash: state.cash - event.cost, totalExpenses: state.totalExpenses + event.cost, eventPopup: null,
        liveFeed: [{ msg: `[EVENT] Bayar ${formatIDR(event.cost)} - masalah selesai 💸`, type: 'warning', tick: state.tick }, ...state.liveFeed].slice(0, 50),
      };
    }

    case 'IGNORE_EVENT': {
      const event = state.eventPopup;
      if (!event?.reputationHit) return { ...state, eventPopup: null };
      const repHit = state.employees.cs > 0 ? event.reputationHit * 0.5 : event.reputationHit;
      return {
        ...state, reputation: clamp(state.reputation - repHit, 0, 5), eventPopup: null,
        liveFeed: [{ msg: `[EVENT] Masalah diabaikan - Reputasi -${repHit.toFixed(1)} ⭐`, type: 'error', tick: state.tick }, ...state.liveFeed].slice(0, 50),
      };
    }

    case 'TOGGLE_PAUSE': return { ...state, isRunning: !state.isRunning };
    case 'CLEAR_TOAST': return { ...state, toast: null };
    default: return state;
  }
}

// ============ MAIN APP COMPONENT ============
export default function App() {
  const [gamePhase, setGamePhase] = useState('start'); // 'start' | 'playing'
  const [companyName, setCompanyName] = useState('');
  const [domainName, setDomainName] = useState('');
  const [state, dispatch] = useReducer(gameReducer, createInitialState());
  const [activeTab, setActiveTab] = useState('dashboard');
  const tickRef = useRef(null);
  const saveRef = useRef(null);

  // Check for existing save
  const hasSave = useMemo(() => {
    try { return !!localStorage.getItem(SAVE_KEY); } catch { return false; }
  }, [gamePhase]);

  // Start new game
  const startNewGame = () => {
    if (!companyName.trim() || !domainName.trim()) return;
    const initial = createInitialState(companyName.trim(), domainName.trim());
    dispatch({ type: 'LOAD_STATE', payload: initial });
    setGamePhase('playing');
  };

  // Continue game
  const continueGame = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (saved) {
        dispatch({ type: 'LOAD_STATE', payload: saved });
        setGamePhase('playing');
      }
    } catch (e) { console.error('Load failed', e); }
  };

  // Game tick loop
  useEffect(() => {
    if (gamePhase !== 'playing' || !state.isRunning) {
      if (tickRef.current) clearInterval(tickRef.current);
      return;
    }
    tickRef.current = setInterval(() => dispatch({ type: 'TICK' }), TICK_INTERVAL);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [gamePhase, state.isRunning]);

  // Auto-save every day (when toast appears)
  useEffect(() => {
    if (state.toast && state.toast.msg.includes('Saved') && gamePhase === 'playing') {
      try {
        const toSave = { ...state, toast: null, eventPopup: null };
        localStorage.setItem(SAVE_KEY, JSON.stringify(toSave));
      } catch (e) { console.error('Save failed', e); }
    }
  }, [state.toast]);

  // Toast auto-dismiss
  useEffect(() => {
    if (state.toast) {
      const t = setTimeout(() => dispatch({ type: 'CLEAR_TOAST' }), 3000);
      return () => clearTimeout(t);
    }
  }, [state.toast]);

  if (gamePhase === 'start') {
    return <StartScreen companyName={companyName} setCompanyName={setCompanyName} domainName={domainName} setDomainName={setDomainName} startNewGame={startNewGame} continueGame={continueGame} hasSave={hasSave} />;
  }

  return <GameScreen state={state} dispatch={dispatch} activeTab={activeTab} setActiveTab={setActiveTab} />;
}


// ============ START SCREEN ============
function StartScreen({ companyName, setCompanyName, domainName, setDomainName, startNewGame, continueGame, hasSave }) {
  const [showNewGame, setShowNewGame] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo & Title */}
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">🎮</div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Juragan TopUp
          </h1>
          <p className="text-lg text-slate-400 mt-2 font-medium">Server Tycoon Simulator</p>
          <p className="text-sm text-slate-500 mt-1">Bangun kerajaan top-up game #1 di Indonesia 🇮🇩</p>
        </div>

        {!showNewGame ? (
          <div className="space-y-4">
            <button onClick={() => setShowNewGame(true)} className="w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 rounded-xl text-white font-bold text-lg transition-all transform hover:scale-[1.02] shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-3">
              <Rocket size={22} /> New Game
            </button>
            <button onClick={continueGame} disabled={!hasSave} className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${hasSave ? 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-600' : 'bg-slate-800/50 text-slate-600 cursor-not-allowed border border-slate-700/50'}`}>
              <Play size={22} /> Continue Game {!hasSave && <span className="text-xs">(No Save)</span>}
            </button>
            {hasSave && (
              <button onClick={() => { localStorage.removeItem(SAVE_KEY); window.location.reload(); }} className="w-full py-2 text-sm text-red-400 hover:text-red-300 transition-colors">
                🗑️ Delete Save Data
              </button>
            )}
          </div>
        ) : (
          <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 space-y-5">
            <h2 className="text-xl font-bold text-white flex items-center gap-2"><Building2 size={20} className="text-cyan-400" /> Setup Startup Kamu</h2>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Nama Perusahaan</label>
              <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="PT Nusantara Digital" className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Domain Website</label>
              <input value={domainName} onChange={e => setDomainName(e.target.value)} placeholder="garudatopup.id" className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-colors" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowNewGame(false)} className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium text-slate-300 transition-colors">Kembali</button>
              <button onClick={startNewGame} disabled={!companyName.trim() || !domainName.trim()} className={`flex-1 py-3 rounded-lg font-bold transition-all ${companyName.trim() && domainName.trim() ? 'bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}>
                🚀 Mulai Bisnis!
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-slate-600 mt-8">v2.0 — Built with React + Tailwind</p>
      </div>
    </div>
  );
}


// ============ GAME SCREEN ============
function GameScreen({ state, dispatch, activeTab, setActiveTab }) {
  const serverLoad = useMemo(() => {
    const max = getServerMaxUsers(state.serverTier);
    return max > 0 ? (state.activeUsers / max) * 100 : 0;
  }, [state.activeUsers, state.serverTier]);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'katalog', label: 'Katalog', icon: Package },
    { id: 'infra', label: 'Infrastruktur', icon: Server },
    { id: 'hrd', label: 'HRD & Kantor', icon: Users },
    { id: 'pendanaan', label: 'Pendanaan & VC', icon: Briefcase },
    { id: 'laporan', label: 'Laporan', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      {/* Sidebar */}
      <aside className="w-60 bg-slate-900/80 border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-800">
          <h1 className="text-sm font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">🎮 Juragan TopUp</h1>
          <p className="text-[10px] text-slate-500 mt-0.5">{state.companyName}</p>
        </div>
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${activeTab === tab.id ? 'bg-gradient-to-r from-cyan-500/15 to-purple-500/15 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
              <tab.icon size={15} /> {tab.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-800 space-y-2">
          <div className="text-[10px] text-slate-500">Hari {state.day} | {String(state.hour).padStart(2, '0')}:00 | Tick #{state.tick}</div>
          <div className="text-[10px] text-slate-500">Equity: {state.equity}% | Stage: {state.fundingStage}</div>
          <button onClick={() => dispatch({ type: 'TOGGLE_PAUSE' })} className={`w-full py-2 rounded text-xs font-bold transition-colors ${state.isRunning ? 'bg-yellow-600/80 hover:bg-yellow-600' : 'bg-green-600/80 hover:bg-green-600'}`}>
            {state.isRunning ? '⏸ PAUSE' : '▶ RESUME'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Address Bar Header */}
        <header className="bg-slate-900/60 border-b border-slate-800 px-4 py-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-800 rounded-full px-4 py-1.5 flex-1 max-w-md">
              <Globe size={12} className="text-green-400" />
              <span className="text-xs text-slate-300 font-mono">{state.domainName || 'localhost'}</span>
              <Shield size={12} className="text-green-400 ml-auto" />
            </div>
            <div className="flex items-center gap-4 ml-auto">
              <StatBadge icon={DollarSign} label="Kas" value={formatIDR(state.cash)} color={state.cash > 0 ? 'text-green-400' : 'text-red-400'} />
              <StatBadge icon={Users} label="Users" value={state.activeUsers.toLocaleString()} color="text-cyan-400" />
              <StatBadge icon={Activity} label="Load" value={`${serverLoad.toFixed(0)}%`} color={serverLoad > 80 ? 'text-red-400' : serverLoad > 50 ? 'text-yellow-400' : 'text-green-400'} />
              <StatBadge icon={Star} label="Rating" value={`${state.reputation.toFixed(1)}⭐`} color="text-yellow-400" />
              {state.serverCrashed && <span className="px-2 py-1 bg-red-900/50 border border-red-500/50 rounded text-red-400 text-[10px] font-bold animate-pulse">🔴 DOWN</span>}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-5">
          {activeTab === 'dashboard' && <DashboardTab state={state} dispatch={dispatch} />}
          {activeTab === 'katalog' && <KatalogTab state={state} dispatch={dispatch} />}
          {activeTab === 'infra' && <InfraTab state={state} dispatch={dispatch} />}
          {activeTab === 'hrd' && <HRDTab state={state} dispatch={dispatch} />}
          {activeTab === 'pendanaan' && <PendanaanTab state={state} dispatch={dispatch} />}
          {activeTab === 'laporan' && <LaporanTab state={state} />}
        </main>
      </div>

      {/* Toast */}
      {state.toast && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className={`px-4 py-2 rounded-lg text-sm font-medium shadow-lg ${state.toast.type === 'success' ? 'bg-green-900/90 border border-green-500/50 text-green-300' : 'bg-red-900/90 border border-red-500/50 text-red-300'}`}>
            {state.toast.msg}
          </div>
        </div>
      )}

      {/* Event Popup */}
      {state.eventPopup && <EventPopup event={state.eventPopup} dispatch={dispatch} cash={state.cash} />}

      {/* Game Over */}
      {state.gameOver && <GameOverModal state={state} />}
    </div>
  );
}


// ============ STAT BADGE ============
function StatBadge({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon size={13} className={color} />
      <div>
        <div className="text-[9px] text-slate-500 uppercase leading-none">{label}</div>
        <div className={`text-[11px] font-bold ${color} leading-tight`}>{value}</div>
      </div>
    </div>
  );
}

// ============ DASHBOARD TAB ============
function DashboardTab({ state, dispatch }) {
  const maxTraffic = Math.max(...state.trafficHistory, 1);
  const mrr = calculateMRR(state);
  const valuation = calculateValuation(state);
  const burnRate = getServerCost(state.serverTier) + Object.entries(state.employees).reduce((s, [id, c]) => s + (EMPLOYEES.find(e => e.id === id)?.salary || 0) * c, 0);

  return (
    <div className="space-y-5">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <QuickStat label="Revenue Total" value={formatIDR(state.totalRevenue)} icon={TrendingUp} color="text-green-400" />
        <QuickStat label="Expenses Total" value={formatIDR(state.totalExpenses)} icon={TrendingDown} color="text-red-400" />
        <QuickStat label="MRR (Est.)" value={formatIDR(mrr)} icon={DollarSign} color="text-cyan-400" />
        <QuickStat label="Valuation" value={formatIDR(valuation)} icon={Rocket} color="text-purple-400" />
        <QuickStat label="Burn Rate/tick" value={formatIDR(burnRate)} icon={Zap} color="text-orange-400" />
      </div>

      {/* Traffic Chart */}
      <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-4">
        <h3 className="text-xs font-semibold text-slate-400 mb-3 flex items-center gap-2"><TrendingUp size={14} className="text-cyan-400" /> Traffic Monitor (24 Ticks)</h3>
        <div className="flex items-end gap-0.5 h-28">
          {state.trafficHistory.map((val, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
              <div className={`w-full rounded-t transition-all duration-300 min-h-[2px] ${val / maxTraffic > 0.8 ? 'bg-gradient-to-t from-red-600 to-red-400' : val / maxTraffic > 0.5 ? 'bg-gradient-to-t from-yellow-600 to-yellow-400' : 'bg-gradient-to-t from-cyan-600 to-cyan-400'}`} style={{ height: `${Math.max(2, (val / maxTraffic) * 100)}%` }} />
            </div>
          ))}
        </div>
      </div>

      {/* Pending Orders */}
      {!state.autoProcess && state.pendingOrders > 0 && (
        <div className="bg-orange-900/20 border border-orange-500/30 rounded-xl p-3 flex items-center justify-between">
          <div>
            <p className="text-orange-400 font-semibold text-sm">📋 {state.pendingOrders} Order Pending</p>
            <p className="text-[10px] text-slate-400">Proses manual atau beli Auto-Process API</p>
          </div>
          <button onClick={() => dispatch({ type: 'PROCESS_ORDERS' })} className="px-3 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-xs font-bold transition-colors">Proses</button>
        </div>
      )}

      {/* Live Feed */}
      <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-4">
        <h3 className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-2"><Monitor size={14} className="text-green-400" /> Live Feed</h3>
        <div className="bg-black/40 rounded-lg p-3 h-40 overflow-y-auto font-mono text-[10px] space-y-0.5">
          {state.liveFeed.length === 0 ? <p className="text-slate-600">Waiting...</p> : state.liveFeed.map((item, i) => (
            <div key={i} className={`${item.type === 'success' ? 'text-green-400' : item.type === 'error' ? 'text-red-400' : item.type === 'warning' ? 'text-yellow-400' : 'text-slate-400'}`}>{item.msg}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

function QuickStat({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-3">
      <div className="flex items-center gap-1.5 mb-1"><Icon size={12} className={color} /><span className="text-[9px] text-slate-500 uppercase">{label}</span></div>
      <div className={`text-sm font-bold ${color} truncate`}>{value}</div>
    </div>
  );
}


// ============ KATALOG TAB ============
function KatalogTab({ state, dispatch }) {
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-slate-200">📦 Katalog Produk & Pricing</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {PRODUCTS.map(prod => <ProductCard key={prod.id} product={prod} data={state.products[prod.id]} cash={state.cash} dispatch={dispatch} />)}
      </div>
    </div>
  );
}

function ProductCard({ product, data, cash, dispatch }) {
  const [buyAmount, setBuyAmount] = useState(1000);
  const [newPrice, setNewPrice] = useState(data.retailPrice);
  const totalCost = data.wholesalePrice * buyAmount;
  const marginPct = ((data.retailPrice - data.wholesalePrice) / data.wholesalePrice * 100).toFixed(1);
  const marketPrice = product.marketBase;
  const priceVsMarket = ((data.retailPrice / marketPrice - 1) * 100).toFixed(1);
  const isPriceTooHigh = data.retailPrice > marketPrice * 1.1;

  return (
    <div className="bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden">
      <div className={`bg-gradient-to-r ${product.color} p-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{product.icon}</span>
            <span className="text-sm font-bold">{product.name}</span>
          </div>
          <span className="text-[10px] opacity-80">{product.currency}</span>
        </div>
      </div>
      <div className="p-3 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-slate-400">Stok:</span>
          <span className={`text-xs font-bold ${data.stock < 500 ? 'text-red-400' : 'text-green-400'}`}>{data.stock.toLocaleString()}</span>
        </div>
        <div className="bg-black/30 rounded-lg p-2 space-y-1 text-[10px]">
          <div className="flex justify-between"><span className="text-slate-500">Harga Beli/unit:</span><span className="text-slate-300">{formatIDR(data.wholesalePrice)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Harga Jual/unit:</span><span className="text-cyan-400 font-bold">{formatIDR(data.retailPrice)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Harga Pasaran:</span><span className="text-slate-300">{formatIDR(marketPrice)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Margin:</span><span className={`font-bold ${parseFloat(marginPct) > 30 ? 'text-green-400' : 'text-yellow-400'}`}>{marginPct}%</span></div>
          <div className="flex justify-between"><span className="text-slate-500">vs Market:</span><span className={`font-bold ${isPriceTooHigh ? 'text-red-400' : 'text-green-400'}`}>{priceVsMarket > 0 ? '+' : ''}{priceVsMarket}%</span></div>
          {isPriceTooHigh && <p className="text-red-400 text-[9px]">⚠️ Harga &gt;10% di atas pasaran! Buyer sangat sedikit!</p>}
        </div>
        {/* Set Price */}
        <div className="flex gap-1.5 items-center">
          <input type="number" value={newPrice} onChange={e => setNewPrice(Number(e.target.value))} className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-[10px] text-white w-20" />
          <button onClick={() => dispatch({ type: 'SET_PRICE', payload: { productId: product.id, price: newPrice } })} className="px-2 py-1.5 bg-cyan-600 hover:bg-cyan-700 rounded text-[10px] font-bold transition-colors">Set Harga</button>
        </div>
        {/* Buy Stock */}
        <div className="flex gap-1.5">
          <select value={buyAmount} onChange={e => setBuyAmount(Number(e.target.value))} className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-[10px]">
            <option value={500}>500</option><option value={1000}>1.000</option><option value={5000}>5.000</option><option value={10000}>10.000</option><option value={50000}>50.000</option>
          </select>
          <button onClick={() => dispatch({ type: 'BUY_STOCK', payload: { productId: product.id, amount: buyAmount } })} disabled={cash < totalCost} className={`px-2 py-1.5 rounded text-[10px] font-bold transition-colors ${cash >= totalCost ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-700 opacity-50 cursor-not-allowed'}`}>
            Beli {formatIDR(totalCost)}
          </button>
        </div>
      </div>
    </div>
  );
}


// ============ INFRA TAB ============
function InfraTab({ state, dispatch }) {
  const currentTier = SERVER_TIERS.find(s => s.id === state.serverTier);
  const serverLoad = (state.activeUsers / getServerMaxUsers(state.serverTier)) * 100;

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-slate-200">🖥️ Infrastruktur & Server</h2>

      {/* Current Server */}
      <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-white">{currentTier.name}</h3>
            <p className="text-[10px] text-slate-400">{currentTier.desc}</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-[10px] font-bold ${state.serverCrashed ? 'bg-red-900/50 text-red-400 border border-red-500/50' : 'bg-green-900/50 text-green-400 border border-green-500/50'}`}>
            {state.serverCrashed ? '🔴 CRASHED' : '🟢 ONLINE'}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-black/30 rounded-lg p-2">
            <div className="text-[9px] text-slate-500">Max Users</div>
            <div className="text-sm font-bold text-cyan-400">{currentTier.maxUsers.toLocaleString()}</div>
          </div>
          <div className="bg-black/30 rounded-lg p-2">
            <div className="text-[9px] text-slate-500">Cost/tick</div>
            <div className="text-sm font-bold text-orange-400">{formatIDR(currentTier.costPerTick)}</div>
          </div>
          <div className="bg-black/30 rounded-lg p-2">
            <div className="text-[9px] text-slate-500">Load</div>
            <div className={`text-sm font-bold ${serverLoad > 80 ? 'text-red-400' : serverLoad > 50 ? 'text-yellow-400' : 'text-green-400'}`}>{serverLoad.toFixed(1)}%</div>
          </div>
        </div>
        {/* Load Bar */}
        <div className="mt-3 h-2 bg-slate-800 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${serverLoad > 80 ? 'bg-red-500' : serverLoad > 50 ? 'bg-yellow-500' : 'bg-cyan-500'}`} style={{ width: `${Math.min(100, serverLoad)}%` }} />
        </div>
      </div>

      {/* Upgrade Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {SERVER_TIERS.filter(t => t.id > state.serverTier).map(tier => (
          <div key={tier.id} className="bg-slate-900/60 rounded-xl border border-slate-800 p-3">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-xs font-bold text-white">{tier.name}</h4>
              <span className="text-[10px] text-slate-400">Max {tier.maxUsers.toLocaleString()} users</span>
            </div>
            <p className="text-[10px] text-slate-500 mb-2">{tier.desc} | Cost: {formatIDR(tier.costPerTick)}/tick | Uptime: {tier.uptime}%</p>
            <button onClick={() => dispatch({ type: 'UPGRADE_SERVER', payload: { tierId: tier.id } })} disabled={state.cash < tier.price} className={`w-full py-2 rounded text-[10px] font-bold transition-colors ${state.cash >= tier.price ? 'bg-purple-600 hover:bg-purple-700' : 'bg-slate-700 opacity-50 cursor-not-allowed'}`}>
              Upgrade {formatIDR(tier.price)}
            </button>
          </div>
        ))}
      </div>

      {/* Auto Process */}
      <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">🤖 Auto-Process API</h3>
            <p className="text-[10px] text-slate-400">{state.autoProcess ? 'ACTIVE - Semua order otomatis diproses' : 'Order harus diproses manual (max 10/tick)'}</p>
          </div>
          {!state.autoProcess && (
            <button onClick={() => dispatch({ type: 'BUY_AUTO_PROCESS' })} disabled={state.cash < 1000000} className={`px-3 py-2 rounded text-[10px] font-bold transition-colors ${state.cash >= 1000000 ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-slate-700 opacity-50 cursor-not-allowed'}`}>
              Beli {formatIDR(1000000)}
            </button>
          )}
          {state.autoProcess && <span className="text-green-400 text-xs font-bold">✅ Active</span>}
        </div>
      </div>

      {/* Marketing */}
      <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-4">
        <h3 className="text-sm font-bold text-white mb-3">📢 Marketing & Ads</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {MARKETING_OPTIONS.map(camp => (
            <div key={camp.id} className="bg-black/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span>{camp.icon}</span>
                <span className="text-xs font-bold text-white">{camp.name}</span>
              </div>
              <p className="text-[10px] text-slate-400 mb-2">{camp.trafficBoost}x boost | {camp.duration} ticks</p>
              <button onClick={() => dispatch({ type: 'BUY_MARKETING', payload: { campaignId: camp.id } })} disabled={state.cash < camp.cost} className={`w-full py-1.5 rounded text-[10px] font-bold transition-colors ${state.cash >= camp.cost ? 'bg-purple-600 hover:bg-purple-700' : 'bg-slate-700 opacity-50 cursor-not-allowed'}`}>
                {formatIDR(camp.cost)}
              </button>
            </div>
          ))}
        </div>
        {state.activeCampaigns.length > 0 && (
          <div className="mt-3 space-y-1">
            <p className="text-[10px] text-slate-400 font-semibold">Active Campaigns:</p>
            {state.activeCampaigns.map((c, i) => (
              <div key={i} className="flex justify-between text-[10px] bg-purple-900/20 rounded px-2 py-1">
                <span className="text-purple-300">{c.icon} {c.name}</span>
                <span className="text-slate-400">{c.remaining} ticks left</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


// ============ HRD TAB ============
function HRDTab({ state, dispatch }) {
  const totalSalary = Object.entries(state.employees).reduce((s, [id, count]) => s + (EMPLOYEES.find(e => e.id === id)?.salary || 0) * count, 0);
  const totalStaff = Object.values(state.employees).reduce((s, c) => s + c, 0);

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-slate-200">👔 HRD & Kantor</h2>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-3 text-center">
          <div className="text-[9px] text-slate-500 uppercase">Total Karyawan</div>
          <div className="text-xl font-bold text-cyan-400">{totalStaff}</div>
        </div>
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-3 text-center">
          <div className="text-[9px] text-slate-500 uppercase">Gaji/Tick</div>
          <div className="text-xl font-bold text-orange-400">{formatIDR(totalSalary)}</div>
        </div>
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-3 text-center">
          <div className="text-[9px] text-slate-500 uppercase">Domain Authority</div>
          <div className="text-xl font-bold text-purple-400">{state.domainAuthority.toFixed(1)}</div>
        </div>
      </div>

      {/* Employee Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {EMPLOYEES.map(emp => {
          const count = state.employees[emp.id] || 0;
          const hireCost = emp.salary * 5;
          return (
            <div key={emp.id} className="bg-slate-900/60 rounded-xl border border-slate-800 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{emp.icon}</span>
                <div>
                  <h4 className="text-xs font-bold text-white">{emp.name}</h4>
                  <p className="text-[10px] text-slate-400">Gaji: {formatIDR(emp.salary)}/tick</p>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mb-3">{emp.desc}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400">x{count}</span>
                <div className="flex gap-1.5">
                  {count > 0 && (
                    <button onClick={() => dispatch({ type: 'FIRE_EMPLOYEE', payload: { employeeId: emp.id } })} className="px-2 py-1 bg-red-600/80 hover:bg-red-600 rounded text-[10px] font-bold transition-colors">Pecat</button>
                  )}
                  <button onClick={() => dispatch({ type: 'HIRE_EMPLOYEE', payload: { employeeId: emp.id } })} disabled={state.cash < hireCost} className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${state.cash >= hireCost ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-700 opacity-50 cursor-not-allowed'}`}>
                    Hire ({formatIDR(hireCost)})
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ============ PENDANAAN TAB ============
function PendanaanTab({ state, dispatch }) {
  const mrr = calculateMRR(state);
  const valuation = calculateValuation(state);
  const uptime = getServerUptime(state.serverTier);

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-slate-200">🚀 Pendanaan & Venture Capital</h2>

      {/* Company Info */}
      <div className="bg-gradient-to-r from-purple-900/40 to-cyan-900/40 rounded-xl border border-purple-500/20 p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div><div className="text-[9px] text-slate-400 uppercase">Valuasi</div><div className="text-sm font-bold text-purple-400">{formatIDR(valuation)}</div></div>
          <div><div className="text-[9px] text-slate-400 uppercase">MRR</div><div className="text-sm font-bold text-cyan-400">{formatIDR(mrr)}</div></div>
          <div><div className="text-[9px] text-slate-400 uppercase">Equity Founder</div><div className="text-sm font-bold text-green-400">{state.equity}%</div></div>
          <div><div className="text-[9px] text-slate-400 uppercase">Stage</div><div className="text-sm font-bold text-yellow-400 capitalize">{state.fundingStage}</div></div>
        </div>
      </div>

      {/* Current Metrics */}
      <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-4">
        <h3 className="text-xs font-bold text-slate-300 mb-3">📊 Metrics Kamu (untuk Pitching)</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-black/30 rounded-lg p-3">
            <div className="text-[9px] text-slate-500">MRR</div>
            <div className="text-sm font-bold text-cyan-400">{formatIDR(mrr)}</div>
          </div>
          <div className="bg-black/30 rounded-lg p-3">
            <div className="text-[9px] text-slate-500">Total Users</div>
            <div className="text-sm font-bold text-green-400">{state.totalUsers.toLocaleString()}</div>
          </div>
          <div className="bg-black/30 rounded-lg p-3">
            <div className="text-[9px] text-slate-500">Server Uptime</div>
            <div className="text-sm font-bold text-purple-400">{uptime}%</div>
          </div>
        </div>
      </div>

      {/* Funding Tiers */}
      <div className="space-y-3">
        {FUNDING_TIERS.map(tier => {
          const alreadyFunded = state.fundingHistory.includes(tier.id);
          const meetsReqs = mrr >= tier.requirements.mrr && state.totalUsers >= tier.requirements.users && uptime >= tier.requirements.uptime;
          return (
            <div key={tier.id} className={`bg-slate-900/60 rounded-xl border p-4 ${alreadyFunded ? 'border-green-500/30 opacity-60' : meetsReqs ? 'border-cyan-500/30' : 'border-slate-800'}`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="text-sm font-bold text-white">{tier.name} {alreadyFunded && '✅'}</h4>
                  <p className="text-[10px] text-slate-400">{tier.desc}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-green-400">{formatIDR(tier.amount)}</div>
                  <div className="text-[10px] text-red-400">-{tier.equityTaken}% equity</div>
                </div>
              </div>
              {/* Requirements */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className={`text-[10px] rounded p-1.5 text-center ${mrr >= tier.requirements.mrr ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                  MRR ≥ {formatIDR(tier.requirements.mrr)}
                </div>
                <div className={`text-[10px] rounded p-1.5 text-center ${state.totalUsers >= tier.requirements.users ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                  Users ≥ {tier.requirements.users.toLocaleString()}
                </div>
                <div className={`text-[10px] rounded p-1.5 text-center ${uptime >= tier.requirements.uptime ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                  Uptime ≥ {tier.requirements.uptime}%
                </div>
              </div>
              <button onClick={() => dispatch({ type: 'PITCH_VC', payload: { fundingId: tier.id } })} disabled={alreadyFunded || !meetsReqs} className={`w-full py-2 rounded text-xs font-bold transition-colors ${alreadyFunded ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : meetsReqs ? 'bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}>
                {alreadyFunded ? 'Sudah Funded' : meetsReqs ? '🎤 Pitch ke VC!' : 'Requirements Belum Terpenuhi'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ============ LAPORAN TAB ============
function LaporanTab({ state }) {
  const avgDailyRevenue = state.day > 1 ? state.totalRevenue / (state.day - 1) : state.todayRevenue;
  const avgDailyExpense = state.day > 1 ? state.totalExpenses / (state.day - 1) : state.todayExpenses;
  const netProfit = state.totalRevenue - state.totalExpenses;
  const maxRev = Math.max(...state.revenueHistory, 1);

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-slate-200">📊 Laporan Keuangan</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-3">
          <div className="text-[9px] text-slate-500 uppercase">Total Revenue</div>
          <div className="text-sm font-bold text-green-400">{formatIDR(state.totalRevenue)}</div>
        </div>
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-3">
          <div className="text-[9px] text-slate-500 uppercase">Total Expenses</div>
          <div className="text-sm font-bold text-red-400">{formatIDR(state.totalExpenses)}</div>
        </div>
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-3">
          <div className="text-[9px] text-slate-500 uppercase">Net Profit</div>
          <div className={`text-sm font-bold ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatIDR(netProfit)}</div>
        </div>
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-3">
          <div className="text-[9px] text-slate-500 uppercase">PG Fees Total</div>
          <div className="text-sm font-bold text-orange-400">{formatIDR(state.pgFeesTotal)}</div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-4">
        <h3 className="text-xs font-semibold text-slate-400 mb-3">📈 Revenue Harian (30 Hari Terakhir)</h3>
        <div className="flex items-end gap-0.5 h-24">
          {state.revenueHistory.map((val, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
              <div className="w-full rounded-t bg-gradient-to-t from-green-600 to-green-400 transition-all duration-300 min-h-[1px]" style={{ height: `${Math.max(1, (val / maxRev) * 100)}%` }} />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-1 text-[9px] text-slate-500"><span>-30 hari</span><span>Hari ini</span></div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-3">
          <div className="text-[9px] text-slate-500 uppercase">Avg Revenue/Hari</div>
          <div className="text-sm font-bold text-green-400">{formatIDR(avgDailyRevenue)}</div>
        </div>
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-3">
          <div className="text-[9px] text-slate-500 uppercase">Avg Expense/Hari</div>
          <div className="text-sm font-bold text-red-400">{formatIDR(avgDailyExpense)}</div>
        </div>
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-3">
          <div className="text-[9px] text-slate-500 uppercase">Total Transaksi</div>
          <div className="text-sm font-bold text-cyan-400">{state.totalTransactions.toLocaleString()}</div>
        </div>
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-3">
          <div className="text-[9px] text-slate-500 uppercase">Order Gagal</div>
          <div className="text-sm font-bold text-red-400">{state.totalOrdersFailed.toLocaleString()}</div>
        </div>
      </div>

      {/* Payment Gateway Info */}
      <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-4">
        <h3 className="text-xs font-bold text-slate-300 mb-3">💳 Payment Gateway Fees (MDR)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {PAYMENT_GATEWAYS.map(pg => (
            <div key={pg.id} className="bg-black/30 rounded-lg p-2 text-center">
              <span className="text-lg">{pg.icon}</span>
              <div className="text-[10px] text-white font-medium mt-1">{pg.name}</div>
              <div className="text-[10px] text-slate-400">{pg.feeType === 'percentage' ? `${pg.fee}%` : formatIDR(pg.fee)}</div>
            </div>
          ))}
        </div>
        {state.employees.finance > 0 && <p className="text-[10px] text-green-400 mt-2">✅ Finance Manager aktif: Fee dikurangi 20%</p>}
      </div>

      {/* Daily Log */}
      <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-4">
        <h3 className="text-xs font-bold text-slate-300 mb-3">📋 Log Harian</h3>
        <div className="max-h-60 overflow-y-auto space-y-1">
          {state.financeLog.length === 0 ? <p className="text-[10px] text-slate-500">Belum ada data...</p> : state.financeLog.map((log, i) => (
            <div key={i} className="flex items-center justify-between text-[10px] bg-black/20 rounded px-3 py-1.5">
              <span className="text-slate-400">Hari {log.day}</span>
              <span className="text-green-400">+{formatIDR(log.revenue)}</span>
              <span className="text-red-400">-{formatIDR(log.expenses)}</span>
              <span className={`font-bold ${log.net >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatIDR(log.net)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


// ============ EVENT POPUP ============
function EventPopup({ event, dispatch, cash }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <h3 className="text-lg font-bold text-white mb-2">{event.title}</h3>
        <p className="text-sm text-slate-300 mb-5">{event.desc}</p>
        <div className="flex gap-3">
          {event.cost ? (
            <>
              <button onClick={() => dispatch({ type: 'PAY_EVENT' })} disabled={cash < event.cost} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors ${cash >= event.cost ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-700 opacity-50 cursor-not-allowed'}`}>
                💸 Bayar {formatIDR(event.cost)}
              </button>
              <button onClick={() => dispatch({ type: 'IGNORE_EVENT' })} className="flex-1 py-2.5 bg-red-600/80 hover:bg-red-600 rounded-lg text-sm font-bold transition-colors">
                😤 Abaikan (-{event.reputationHit}⭐)
              </button>
            </>
          ) : (
            <button onClick={() => dispatch({ type: 'DISMISS_EVENT' })} className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-sm font-bold transition-colors">
              OK, Paham! 👍
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============ GAME OVER MODAL ============
function GameOverModal({ state }) {
  const handleRestart = () => {
    localStorage.removeItem(SAVE_KEY);
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-800 border border-red-500/30 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
        <div className="text-5xl mb-4">💀</div>
        <h2 className="text-2xl font-black text-red-400 mb-2">BANGKRUT!</h2>
        <p className="text-sm text-slate-300 mb-4">Perusahaan kamu kehabisan modal. Kas: {formatIDR(state.cash)}</p>
        <div className="bg-black/30 rounded-lg p-3 mb-5 space-y-1 text-[10px] text-slate-400">
          <div>Hari bertahan: {state.day}</div>
          <div>Total Revenue: {formatIDR(state.totalRevenue)}</div>
          <div>Total Transaksi: {state.totalTransactions.toLocaleString()}</div>
        </div>
        <button onClick={handleRestart} className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 rounded-xl font-bold transition-all flex items-center justify-center gap-2">
          <RotateCcw size={16} /> Main Lagi
        </button>
      </div>
    </div>
  );
}
