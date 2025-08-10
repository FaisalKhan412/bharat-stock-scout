// API Configuration
const ALPHA_VANTAGE_API_KEY = "6CUWCEKKTSLIXQ7L";
const API_BASE_URL = "https://www.alphavantage.co/query";

// Sector-wise stock symbols (BSE format)
const sectorStocks = {
    'IT': ['INFY.BSE', 'TCS.BSE', 'WIPRO.BSE', 'HCLTECH.BSE', 'TECHM.BSE'],
    'BANK': ['HDFCBANK.BSE', 'SBIN.BSE', 'ICICIBANK.BSE', 'KOTAKBANK.BSE', 'AXISBANK.BSE'],
    'AUTO': ['TATAMOTORS.BSE', 'M&M.BSE', 'MARUTI.BSE', 'BAJAJ-AUTO.BSE', 'EICHERMOT.BSE'],
    'FMCG': ['ITC.BSE', 'HINDUNILVR.BSE', 'BRITANNIA.BSE', 'NESTLEIND.BSE', 'DABUR.BSE'],
    'PHARMA': ['SUNPHARMA.BSE', 'DRREDDY.BSE', 'CIPLA.BSE', 'DIVISLAB.BSE', 'LUPIN.BSE'],
    'METAL': ['TATASTEEL.BSE', 'JSWSTEEL.BSE', 'HINDALCO.BSE', 'VEDL.BSE'],
    'ENERGY': ['RELIANCE.BSE', 'ONGC.BSE', 'IOC.BSE', 'BPCL.BSE'],
    'REALTY': ['DLF.BSE', 'SOBHA.BSE', 'GODREJPROP.BSE', 'OBEROIRLTY.BSE']
};

// Core Data Structure
let stocks = {
    intraday: [],
    swing: [],
    investment: []
};

// API Functions
async function fetchStockData(symbol) {
    try {
        const [quoteRes, overviewRes] = await Promise.all([
            fetch(`${API_BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`),
            fetch(`${API_BASE_URL}?function=OVERVIEW&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`)
        ]);
        
        const quoteData = await quoteRes.json();
        const overviewData = await overviewRes.json();
        
        return {
            symbol: symbol.replace('.BSE', ''),
            price: parseFloat(quoteData['Global Quote']['05. price']) || 0,
            pe: parseFloat(overviewData.PERatio) || 0,
            roe: parseFloat(overviewData.ReturnOnEquityTTM) || 0,
            sector: Object.keys(sectorStocks).find(sector => sectorStocks[sector].includes(symbol)),
            dividendYield: parseFloat(overviewData.DividendYield) * 100 || 0,
            volume: (quoteData['Global Quote']['06. volume'] || '0').slice(0, -3) + 'K',
            rsi: Math.floor(Math.random() * 30) + 35,
            pattern: ['Cup & Handle', 'Double Bottom', 'Flag', 'Triangle'][Math.floor(Math.random() * 4)]
        };
    } catch (error) {
        console.error(`Error fetching ${symbol}:`, error);
        return null;
    }
}

function generateTradeSignals(stock) {
    const volatility = (Math.random() * 0.1) + 0.05;
    return {
        target: stock.price * (1 + volatility),
        stopLoss: stock.price * (1 - (volatility * 0.7))
    };
}

async function initializeStocks() {
    document.getElementById('api-status').style.display = 'block';
    
    // Initialize sector filter dropdown
    const sectorFilter = document.getElementById('sector-filter');
    sectorFilter.innerHTML = '<option value="all">All Sectors</option>';
    Object.keys(sectorStocks).forEach(sector => {
        const option = document.createElement('option');
        option.value = sector;
        option.textContent = sector;
        sectorFilter.appendChild(option);
    });
    
    // Load all stocks
    for (const [sector, symbols] of Object.entries(sectorStocks)) {
        for (const symbol of symbols) {
            const stockData = await fetchStockData(symbol);
            if (!stockData) continue;
            
            const { target, stopLoss } = generateTradeSignals(stockData);
            
            // Add to investment stocks
            stocks.investment.push({
                ...stockData,
                target: Math.round(target * 10) / 10,
                sector
            });
            
            // Randomly assign some stocks to intraday/swing
            if (Math.random() > 0.7) {
                stocks.intraday.push({
                    ...stockData,
                    target: Math.round(target * 10) / 10,
                    stopLoss: Math.round(stopLoss * 10) / 10,
                    volume: (Math.random() * 5 + 1).toFixed(1) + 'M'
                });
            } else if (Math.random() > 0.5) {
                stocks.swing.push({
                    ...stockData,
                    target: Math.round(target * 10) / 10,
                    stopLoss: Math.round(stopLoss * 10) / 10
                });
            }
            
            await new Promise(resolve => setTimeout(resolve, 15000));
        }
    }
    
    document.getElementById('api-status').style.display = 'none';
    renderAllStocks();
}

// Refresh Functions
async function refreshStocks(type) {
    const btn = document.getElementById(`refresh-${type}`);
    btn.classList.add('loading');
    btn.disabled = true;
    document.getElementById('api-status').textContent = `Refreshing ${type} data...`;
    document.getElementById('api-status').style.display = 'block';
    
    for (const stock of stocks[type]) {
        const symbol = stock.symbol + '.BSE';
        try {
            const response = await fetch(`${API_BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`);
            const data = await response.json();
            const price = parseFloat(data['Global Quote']['05. price']);
            
            if (price) {
                stock.price = price;
                const { target, stopLoss } = generateTradeSignals(stock);
                stock.target = Math.round(target * 10) / 10;
                if (stock.stopLoss) stock.stopLoss = Math.round(stopLoss * 10) / 10;
            }
        } catch (error) {
            console.error(`Error refreshing ${symbol}:`, error);
        }
        await new Promise(resolve => setTimeout(resolve, 15000));
    }
    
    renderStocks(type);
    btn.classList.remove('loading');
    btn.disabled = false;
    document.getElementById('api-status').style.display = 'none';
}

// Core Rendering Functions
function calculateMetrics(price, target, stopLoss) {
    const profit = ((target - price) / price * 100).toFixed(1);
    const loss = ((price - stopLoss) / price * 100).toFixed(1);
    return { profit, loss };
}

function renderStockRow(type, stock) {
    const row = document.createElement('tr');
    
    if (type === 'intraday') {
        const { profit, loss } = calculateMetrics(stock.price, stock.target, stock.stopLoss);
        row.innerHTML = `
            <td>${stock.symbol}</td>
            <td>₹${stock.price.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            <td>${stock.volume}</td>
            <td class="${stock.rsi < 30 ? 'profit' : stock.rsi > 70 ? 'loss' : 'neutral'}">${stock.rsi}</td>
            <td>₹${stock.target.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            <td>₹${stock.stopLoss.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            <td class="profit">+${profit}%</td>
            <td class="loss">-${loss}%</td>
        `;
    }
    else if (type === 'swing') {
        const { profit, loss } = calculateMetrics(stock.price, stock.target, stock.stopLoss);
        row.innerHTML = `
            <td>${stock.symbol}</td>
            <td>₹${stock.price.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            <td>${stock.pattern}</td>
            <td>₹${stock.target.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            <td>₹${stock.stopLoss.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            <td class="profit">+${profit}%</td>
            <td class="loss">-${loss}%</td>
        `;
    }
    else {
        row.innerHTML = `
            <td>${stock.symbol}</td>
            <td>₹${stock.price.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            <td class="${stock.pe < 20 ? 'profit' : 'loss'}">${stock.pe.toFixed(1)}</td>
            <td class="${stock.roe > 15 ? 'profit' : 'loss'}">${stock.roe.toFixed(1)}%</td>
            <td>${stock.sector}</td>
            <td>${stock.dividendYield.toFixed(1)}%</td>
            <td>₹${stock.target.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
        `;
    }
    
    return row;
}

function renderStocks(type) {
    const container = document.getElementById(`${type}-stocks`);
    if (!container) return;
    
    container.innerHTML = '';
    stocks[type].forEach(stock => {
        container.appendChild(renderStockRow(type, stock));
    });
}

function renderAllStocks() {
    renderStocks('intraday');
    renderStocks('swing');
    renderStocks('investment');
}

function setupSectorFilter() {
    const filter = document.getElementById('sector-filter');
    if (!filter) return;
    
    filter.addEventListener('change', (e) => {
        const sector = e.target.value;
        const container = document.getElementById('investment-stocks');
        
        if (sector === 'all') {
            renderStocks('investment');
            return;
        }
        
        container.innerHTML = '';
        stocks.investment
            .filter(stock => stock.sector === sector)
            .forEach(stock => {
                container.appendChild(renderStockRow('investment', stock));
            });
    });
}

function setupManualRefresh() {
    document.getElementById('refresh-intraday').addEventListener('click', () => refreshStocks('intraday'));
    document.getElementById('refresh-swing').addEventListener('click', () => refreshStocks('swing'));
    document.getElementById('refresh-investment').addEventListener('click', () => refreshStocks('investment'));
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await initializeStocks();
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelector('.tab-btn.active').classList.remove('active');
            document.querySelector('.tab-content.active').classList.remove('active');
            
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });
    
    setupSectorFilter();
    setupManualRefresh();

    // Auto-refresh all data every 5 minutes
    setInterval(async () => {
        await refreshStocks('intraday');
        await refreshStocks('swing');
        await refreshStocks('investment');
    }, 300000);
});