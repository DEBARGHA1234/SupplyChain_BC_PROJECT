import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ethers } from 'ethers';

const CONTRACT_ADDRESS = '0x417Bf7C9dc415FEEb693B6FE313d1186C692600F';
const CONTRACT_ABI = [
  { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "uint256", "name": "id", "type": "uint256" }, { "indexed": false, "internalType": "string", "name": "name", "type": "string" }, { "indexed": true, "internalType": "address", "name": "manufacturer", "type": "address" }], "name": "ProductCreated", "type": "event" },
  { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "uint256", "name": "id", "type": "uint256" }, { "indexed": false, "internalType": "enum SupplyChain.Status", "name": "status", "type": "uint8" }, { "indexed": false, "internalType": "string", "name": "location", "type": "string" }, { "indexed": true, "internalType": "address", "name": "updatedBy", "type": "address" }], "name": "StatusUpdated", "type": "event" },
  { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "user", "type": "address" }, { "indexed": false, "internalType": "enum SupplyChain.Role", "name": "role", "type": "uint8" }], "name": "UserRegistered", "type": "event" },
  { "inputs": [{ "internalType": "string", "name": "_name", "type": "string" }, { "internalType": "string", "name": "_description", "type": "string" }, { "internalType": "string", "name": "_initialLocation", "type": "string" }], "name": "createProduct", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "_id", "type": "uint256" }], "name": "getProduct", "outputs": [{ "internalType": "uint256", "name": "id", "type": "uint256" }, { "internalType": "string", "name": "name", "type": "string" }, { "internalType": "string", "name": "description", "type": "string" }, { "internalType": "address", "name": "manufacturer", "type": "address" }, { "internalType": "address", "name": "supplier", "type": "address" }, { "internalType": "address", "name": "deliveryPerson", "type": "address" }, { "internalType": "address", "name": "customer", "type": "address" }, { "internalType": "address", "name": "currentOwner", "type": "address" }, { "internalType": "enum SupplyChain.Status", "name": "status", "type": "uint8" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "_id", "type": "uint256" }], "name": "getProductHistory", "outputs": [{ "components": [{ "internalType": "string", "name": "location", "type": "string" }, { "internalType": "uint256", "name": "timestamp", "type": "uint256" }, { "internalType": "address", "name": "updatedBy", "type": "address" }, { "internalType": "enum SupplyChain.Status", "name": "status", "type": "uint8" }], "internalType": "struct SupplyChain.TrackingStep[]", "name": "", "type": "tuple[]" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "productCount", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "enum SupplyChain.Role", "name": "_role", "type": "uint8" }], "name": "registerUser", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "_id", "type": "uint256" }, { "internalType": "enum SupplyChain.Status", "name": "_newStatus", "type": "uint8" }, { "internalType": "string", "name": "_location", "type": "string" }, { "internalType": "address", "name": "_nextOwner", "type": "address" }], "name": "updateStatus", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "userRoles", "outputs": [{ "internalType": "enum SupplyChain.Role", "name": "", "type": "uint8" }], "stateMutability": "view", "type": "function" }
];

const ROLES = ['Unregistered', 'Manufacturer', 'Supplier', 'Delivery Person', 'Customer'];
const STATUSES = ['Created', 'In Transit', 'Delivered', 'Received'];

const SAMPLE_PRODUCTS_DATA = [
  { name: "Organic Fairtrade Coffee Beans Batch #101", description: "Grade A Arabica beans harvested from high-altitude farm.", location: "Medellín, Colombia" },
  { name: "Precision Industrial Sensor Array Alpha", description: "IoT temperature & humidity sensors for cold chain monitoring.", location: "Stuttgart, Germany" },
  { name: "Extra Virgin Artisanal Olive Oil Lot #42", description: "Cold pressed organic extra virgin olive oil in dark glass bottles.", location: "Tuscany, Italy" },
  { name: "Pharmaceutical Grade Vaccines Batch B9", description: "Temperature-sensitive vaccines stored at -20°C.", location: "Basel, Switzerland" },
  { name: "Luxury Swiss Watch Chronograph Movement", description: "Handcrafted automatic movement serial #88201.", location: "Geneva, Switzerland" },
  { name: "Solar Panel Photovoltaic Cell Array X7", description: "Monocrystalline high-efficiency solar panel module.", location: "Kyoto, Japan" },
  { name: "Bio-degradable Packaging Film Roll", description: "Compostable plant-based eco packaging film.", location: "Portland, USA" },
  { name: "Cold-Pressed Raw Almond Oil Batch #15", description: "100% pure organic almond oil for cosmetics.", location: "Valencia, Spain" },
  { name: "Electric Vehicle Battery Pack v3", description: "Lithium-ion high density energy battery module.", location: "Fremont, USA" },
  { name: "Aerospace Grade Titanium Components", description: "Precision machined titanium alloy structural parts.", location: "Toulouse, France" },
  { name: "Specialty Ethiopian Yirgacheffe Coffee", description: "Single-origin washed Ethiopian coffee beans.", location: "Addis Ababa, Ethiopia" },
  { name: "Smart Microcontroller Chip Module", description: "32-bit RISC-V embedded microchips lot #993.", location: "Hsinchu, Taiwan" },
  { name: "Organic Wildflower Honey Barrel #8", description: "Raw unfiltered organic honey in food-grade barrel.", location: "Waikato, New Zealand" },
  { name: "High-Purity Copper Wire Coil 500m", description: "99.99% oxygen-free copper electrical wiring.", location: "Santiago, Chile" },
  { name: "Gourmet Single-Origin Cocoa Mass Batch #3", description: "70% dark cocoa liquor mass for bean-to-bar chocolate.", location: "Accra, Ghana" }
];

const short = (value) => value ? `${value.slice(0, 6)}…${value.slice(-4)}` : 'Not connected';
const sameAddress = (a, b) => Boolean(a && b && a.toLowerCase() === b.toLowerCase());

export default function App() {
  const config = window.__QUICK_DAPP_CONFIG__ || {};
  const [account, setAccount] = useState('');
  const [userRole, setUserRole] = useState(0); // On-chain registered role
  const [activeRoleView, setActiveRoleView] = useState('all'); // Navigation menu filter: 'all', 'manufacturer', 'supplier', 'delivery', 'customer', 'register', 'seed'
  const [activeTab, setActiveTab] = useState('overview'); // Sub-tab view
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(false);
  const [seedProgress, setSeedProgress] = useState(null);
  const [notice, setNotice] = useState(null);
  const [registrationRole, setRegistrationRole] = useState(1);
  const [filterQuery, setFilterQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Forms
  const [createForm, setCreateForm] = useState({ name: '', description: '', location: '' });
  const [supplyForm, setSupplyForm] = useState({ id: '', quantity: '', notes: '', location: '', timestamp: new Date().toISOString().slice(0, 16), nextOwner: '' });
  const [deliveryForm, setDeliveryForm] = useState({ id: '', status: 1, location: '', nextOwner: '' });
  const [confirmForm, setConfirmForm] = useState({ id: '', location: '' });
  const [lookupId, setLookupId] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);

  const providerContract = () => {
    if (!window.ethereum) throw new Error('Wallet provider is unavailable in this preview.');
    const provider = new ethers.BrowserProvider(window.ethereum);
    return { provider, contract: new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider) };
  };

  const signerContract = async () => {
    if (!window.ethereum) throw new Error('Wallet provider is unavailable in this preview.');
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  };

  const message = (type, text) => setNotice({ type, text });

  const loadData = async (address) => {
    if (!window.ethereum) return;
    setLoading(true);
    try {
      const { contract } = providerContract();
      const role = address ? Number(await contract.userRoles(address)) : 0;
      const count = Number(await contract.productCount());
      const rows = [];
      for (let id = count; id >= Math.max(1, count - 50); id -= 1) {
        try {
          const p = await contract.getProduct(id);
          rows.push({
            id: Number(p.id),
            name: p.name,
            description: p.description,
            manufacturer: p.manufacturer,
            supplier: p.supplier,
            deliveryPerson: p.deliveryPerson,
            customer: p.customer,
            currentOwner: p.currentOwner,
            status: Number(p.status)
          });
        } catch (error) {
          console.warn(`Unable to load product ${id}`, error);
        }
      }
      setUserRole(role);
      setTotalProducts(count);
      setProducts(rows);
    } catch (error) {
      console.error(error);
      message('error', error.shortMessage || error.message || 'Unable to read contract data.');
    } finally {
      setLoading(false);
    }
  };

  const connectWallet = async () => {
    try {
      const { provider } = providerContract();
      const accounts = await provider.send('eth_requestAccounts', []);
      const next = accounts[0] || '';
      setAccount(next);
      await loadData(next);
    } catch (error) {
      message('error', error.shortMessage || error.message || 'Could not connect the account.');
    }
  };

  useEffect(() => {
    connectWallet();
    if (!window.ethereum) return undefined;
    const onAccountsChanged = async (accounts) => {
      const next = accounts[0] || '';
      setAccount(next);
      setLookupResult(null);
      setHistory([]);
      if (next) await loadData(next);
      else {
        setUserRole(0);
        setProducts([]);
      }
    };
    window.ethereum.on('accountsChanged', onAccountsChanged);
    return () => window.ethereum.removeListener?.('accountsChanged', onAccountsChanged);
  }, []);

  useEffect(() => () => {
    const stream = videoRef.current?.srcObject;
    stream?.getTracks().forEach((track) => track.stop());
  }, []);

  const runTransaction = async (pendingText, successText, action) => {
    setLoading(true);
    try {
      const contract = await signerContract();
      const tx = await action(contract);
      message('pending', pendingText);
      await tx.wait();
      message('success', successText);
      await loadData(account);
      return true;
    } catch (error) {
      message('error', error.reason || error.shortMessage || error.message || 'Transaction failed.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const checkRoleRequirement = (requiredRole) => {
    if (userRole !== requiredRole) {
      message('error', `Action requires on-chain registration as ${ROLES[requiredRole]}. Your current registered role is ${ROLES[userRole]}. Please register under Role Management if needed.`);
      return false;
    }
    return true;
  };

  const register = async (event) => {
    event?.preventDefault();
    if (userRole !== 0) {
      message('error', `This wallet is already registered as ${ROLES[userRole]}.`);
      return;
    }
    await runTransaction(
      'Registering role on-chain…',
      `Wallet registered as ${ROLES[registrationRole]}.`,
      (contract) => contract.registerUser(registrationRole)
    );
  };

  const createProduct = async (event) => {
    event.preventDefault();
    if (!checkRoleRequirement(1)) return;
    if (!createForm.name.trim() || !createForm.location.trim()) return message('error', 'Product name and origin location are required.');
    const ok = await runTransaction(
      'Creating product on-chain…',
      'Product created successfully.',
      (contract) => contract.createProduct(createForm.name.trim(), createForm.description.trim(), createForm.location.trim())
    );
    if (ok) setCreateForm({ name: '', description: '', location: '' });
  };

  const submitSupply = async (event) => {
    event.preventDefault();
    if (!checkRoleRequirement(2)) return;
    if (!supplyForm.id || !supplyForm.quantity || !supplyForm.location.trim()) return message('error', 'Product ID, quantity, and location are required.');
    if (supplyForm.nextOwner && !ethers.isAddress(supplyForm.nextOwner)) return message('error', 'Next owner must be a valid EVM address.');
    const details = `${supplyForm.location.trim()} | Qty: ${supplyForm.quantity} | Notes: ${supplyForm.notes.trim() || 'None'} | Time: ${supplyForm.timestamp}`;
    const nextOwner = supplyForm.nextOwner.trim() || ethers.ZeroAddress;
    const ok = await runTransaction(
      'Recording supply details on-chain…',
      'Supply details and handoff recorded.',
      (contract) => contract.updateStatus(Number(supplyForm.id), 1, details, nextOwner)
    );
    if (ok) setSupplyForm({ id: '', quantity: '', notes: '', location: '', timestamp: new Date().toISOString().slice(0, 16), nextOwner: '' });
  };

  const assignedDeliveries = useMemo(
    () => products.filter((p) => sameAddress(p.deliveryPerson, account) || sameAddress(p.currentOwner, account)),
    [products, account]
  );

  const submitDelivery = async (event) => {
    event.preventDefault();
    if (!checkRoleRequirement(3)) return;
    if (!deliveryForm.id) return message('error', 'Please select a product ID.');
    if (!deliveryForm.location.trim()) return message('error', 'Checkpoint location is required.');
    if (deliveryForm.nextOwner && !ethers.isAddress(deliveryForm.nextOwner)) return message('error', 'Next owner must be a valid address.');
    const nextOwner = deliveryForm.nextOwner.trim() || ethers.ZeroAddress;
    await runTransaction(
      'Submitting delivery checkpoint…',
      `Product #${deliveryForm.id} status updated to ${STATUSES[deliveryForm.status]}.`,
      (contract) => contract.updateStatus(Number(deliveryForm.id), Number(deliveryForm.status), deliveryForm.location.trim(), nextOwner)
    );
  };

  const lookup = async (id = lookupId) => {
    if (!id) return;
    setLoading(true);
    try {
      const { contract } = providerContract();
      const p = await contract.getProduct(Number(id));
      const steps = await contract.getProductHistory(Number(id));
      setLookupId(String(id));
      setLookupResult({
        id: Number(p.id),
        name: p.name,
        description: p.description,
        manufacturer: p.manufacturer,
        supplier: p.supplier,
        deliveryPerson: p.deliveryPerson,
        customer: p.customer,
        currentOwner: p.currentOwner,
        status: Number(p.status)
      });
      setHistory(steps.map((step) => ({
        location: step.location,
        timestamp: new Date(Number(step.timestamp) * 1000).toLocaleString(),
        updatedBy: step.updatedBy,
        status: Number(step.status)
      })));
    } catch (error) {
      setLookupResult(null);
      setHistory([]);
      message('error', `Product #${id} could not be loaded or does not exist.`);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelivery = async (event) => {
    event.preventDefault();
    if (!checkRoleRequirement(4)) return;
    if (!confirmForm.id || !confirmForm.location.trim()) return message('error', 'Product ID and receipt location are required.');
    const ok = await runTransaction(
      'Confirming receipt on-chain…',
      `Delivery receipt for product #${confirmForm.id} confirmed.`,
      (contract) => contract.updateStatus(Number(confirmForm.id), 3, confirmForm.location.trim(), ethers.ZeroAddress)
    );
    if (ok) setConfirmForm({ id: '', location: '' });
  };

  const seed15SampleProducts = async () => {
    if (!account) return message('error', 'Please connect a wallet first.');
    setLoading(true);
    try {
      const contract = await signerContract();
      if (userRole !== 1) {
        message('pending', 'Registering wallet as Manufacturer (Role 1) to allow product creation...');
        const regTx = await contract.registerUser(1);
        await regTx.wait();
        setUserRole(1);
      }
      setSeedProgress({ current: 0, total: 15, name: SAMPLE_PRODUCTS_DATA[0].name });
      for (let i = 0; i < SAMPLE_PRODUCTS_DATA.length; i++) {
        const item = SAMPLE_PRODUCTS_DATA[i];
        setSeedProgress({ current: i + 1, total: 15, name: item.name });
        message('pending', `[${i + 1}/15] Adding sample product: ${item.name}`);
        const tx = await contract.createProduct(item.name, item.description, item.location);
        await tx.wait();
      }
      message('success', 'Successfully added 15 sample products to the SupplyChain contract!');
      await loadData(account);
    } catch (error) {
      message('error', error.reason || error.shortMessage || error.message || 'Seeding products failed.');
    } finally {
      setLoading(false);
      setSeedProgress(null);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setCameraActive(true);
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 0);
    } catch (error) {
      message('error', `Camera access failed: ${error.message}`);
    }
  };

  const stopCamera = () => {
    videoRef.current?.srcObject?.getTracks().forEach((track) => track.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  };

  const handleQrFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const match = file.name.match(/\d+/);
    if (!match) return message('error', 'Could not infer a product ID. Include the numeric ID in the file name.');
    lookup(match[0]);
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = !filterQuery.trim() || 
        p.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(filterQuery.toLowerCase()) ||
        String(p.id).includes(filterQuery);
      const matchesStatus = filterStatus === 'all' || p.status === Number(filterStatus);
      return matchesSearch && matchesStatus;
    });
  }, [products, filterQuery, filterStatus]);

  const ProductTable = ({ rows, empty }) => (
    <div className="table-wrap">
      {rows.length === 0 ? <div className="empty-state">{empty}</div> : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Product & Description</th>
              <th>Status</th>
              <th>Manufacturer</th>
              <th>Current Owner</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td className="mono font-bold">#{p.id}</td>
                <td>
                  <strong>{p.name}</strong>
                  <span>{p.description || 'No description'}</span>
                </td>
                <td>
                  <span className={`status status-${p.status}`}>{STATUSES[p.status]}</span>
                </td>
                <td className="mono">{short(p.manufacturer)}</td>
                <td className="mono">{short(p.currentOwner)}</td>
                <td>
                  <button className="button button-sm button-dark" onClick={() => { setLookupId(String(p.id)); lookup(p.id); setActiveRoleView('customer'); }}>
                    Trace →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  return (
    <div className="app-shell">
      {/* Top Banner Header */}
      <header className="topbar">
        <div className="brand-mark">{config.logo ? <img src={config.logo} alt="" /> : <span>◫</span>}</div>
        <div className="brand-copy">
          <h1>{config.title || 'SupplyChain Provenance'}</h1>
          <p>{config.description || 'Multi-role Blockchain Supply Chain Management'}</p>
        </div>

        <div className="wallet-panel">
          <div>
            <span>ON-CHAIN ROLE</span>
            <strong className="badge-role">{ROLES[userRole]}</strong>
          </div>
          <button className="button button-dark" onClick={connectWallet}>
            {short(account)}
          </button>
        </div>
      </header>

      {/* Role Navigation Menu Bar */}
      <nav className="role-nav-bar">
        <div className="role-nav-inner">
          <span className="role-nav-label">ROLE PERSPECTIVE & NAVIGATION MENU:</span>
          <div className="role-nav-buttons">
            <button
              className={`role-nav-btn ${activeRoleView === 'all' ? 'active' : ''}`}
              onClick={() => setActiveRoleView('all')}
            >
              🌐 All / Global Ledger
            </button>
            <button
              className={`role-nav-btn ${activeRoleView === 'manufacturer' ? 'active' : ''}`}
              onClick={() => setActiveRoleView('manufacturer')}
            >
              🏢 Manufacturer {userRole === 1 && <span className="my-role-dot" title="Your registered role" />}
            </button>
            <button
              className={`role-nav-btn ${activeRoleView === 'supplier' ? 'active' : ''}`}
              onClick={() => setActiveRoleView('supplier')}
            >
              🚚 Supplier {userRole === 2 && <span className="my-role-dot" title="Your registered role" />}
            </button>
            <button
              className={`role-nav-btn ${activeRoleView === 'delivery' ? 'active' : ''}`}
              onClick={() => setActiveRoleView('delivery')}
            >
              📦 Delivery Person {userRole === 3 && <span className="my-role-dot" title="Your registered role" />}
            </button>
            <button
              className={`role-nav-btn ${activeRoleView === 'customer' ? 'active' : ''}`}
              onClick={() => setActiveRoleView('customer')}
            >
              🔍 Customer / Trace {userRole === 4 && <span className="my-role-dot" title="Your registered role" />}
            </button>
            <button
              className={`role-nav-btn role-nav-action ${activeRoleView === 'register' ? 'active' : ''}`}
              onClick={() => setActiveRoleView('register')}
            >
              ⚙️ Role Management
            </button>
            <button
              className={`role-nav-btn role-nav-seed ${activeRoleView === 'seed' ? 'active' : ''}`}
              onClick={() => setActiveRoleView('seed')}
            >
              ⚡ Add 15 Sample Products
            </button>
          </div>
        </div>
      </nav>

      <div className="workspace">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="role-block">
            <span>ACTIVE NAVIGATION VIEW</span>
            <h2 className="capitalize">{activeRoleView === 'all' ? 'Global Ledger' : activeRoleView} View</h2>
            <p>{account ? `Connected: ${short(account)}` : 'Connect wallet to perform transactions'}</p>
          </div>

          <div className="role-status-card">
            <div className="role-status-row">
              <span>REGISTERED ROLE:</span>
              <strong className="mono">{ROLES[userRole]}</strong>
            </div>
            {userRole === 0 ? (
              <p className="role-hint text-warning">⚠️ No role registered. Click "Role Management" to choose your role on-chain.</p>
            ) : (
              <p className="role-hint text-success">✓ Authorized for {ROLES[userRole]} actions.</p>
            )}
          </div>

          <div className="ledger-stat">
            <span>TOTAL PRODUCTS</span>
            <strong>{totalProducts}</strong>
            <button onClick={() => loadData(account)} disabled={loading}>↻ Refresh Ledger</button>
          </div>

          <p className="contract-label">Contract<br /><span>{CONTRACT_ADDRESS}</span></p>
        </aside>

        {/* Main Content Area */}
        <main className="content">
          {notice && (
            <div className={`notice ${notice.type}`}>
              <span>{notice.text}</span>
              <button onClick={() => setNotice(null)}>Dismiss</button>
            </div>
          )}

          {loading && <div className="progress"><span /></div>}

          {/* VIEW: ALL / GLOBAL LEDGER */}
          {activeRoleView === 'all' && (
            <section>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">SUPPLY CHAIN OVERVIEW</div>
                  <h2>Global Product Ledger</h2>
                  <p className="lead">Filter and explore all products registered on-chain across every stage of the supply chain.</p>
                </div>
                <button className="button button-primary" onClick={seed15SampleProducts} disabled={loading}>
                  ⚡ Seed 15 Products
                </button>
              </div>

              <div className="filter-bar">
                <input
                  type="text"
                  placeholder="Search products by name, description, or ID..."
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                />
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="all">All Statuses</option>
                  <option value="0">Created</option>
                  <option value="1">In Transit</option>
                  <option value="2">Delivered</option>
                  <option value="3">Received</option>
                </select>
              </div>

              <ProductTable rows={filteredProducts} empty="No products found in the ledger." />
            </section>
          )}

          {/* VIEW: MANUFACTURER */}
          {activeRoleView === 'manufacturer' && (
            <section>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">MANUFACTURER DASHBOARD</div>
                  <h2>Product Origination</h2>
                  <p className="lead">Manufacturers initiate new items on the blockchain at the origin facility.</p>
                </div>
                {userRole === 1 && (
                  <button
                    className={`button ${activeTab === 'create' ? 'button-dark' : 'button-primary'}`}
                    onClick={() => setActiveTab(activeTab === 'create' ? 'overview' : 'create')}
                  >
                    {activeTab === 'create' ? '← View Manufacturer Products' : '+ Create New Product'}
                  </button>
                )}
              </div>

              {userRole !== 1 && (
                <div className="notice pending">
                  <span>ℹ️ You are viewing the Manufacturer perspective. Your connected wallet is registered as <b>{ROLES[userRole]}</b>. Switch to Role Management to register as Manufacturer if you want to create products.</span>
                </div>
              )}

              {activeTab === 'create' && userRole === 1 ? (
                <div className="panel narrow">
                  <h3>Create New Product Record</h3>
                  <form onSubmit={createProduct} className="form-stack">
                    <label>
                      Product Name *
                      <input required value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} placeholder="e.g. Organic Fairtrade Coffee Batch #101" />
                    </label>
                    <label>
                      Description / Batch Details
                      <textarea value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} placeholder="Grade, lot number, specifications, packaging..." />
                    </label>
                    <label>
                      Origin Facility & Location *
                      <input required value={createForm.location} onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })} placeholder="e.g. Medellín, Colombia" />
                    </label>
                    <button className="button button-primary full" disabled={loading}>Create Product On-Chain</button>
                  </form>
                </div>
              ) : (
                <div>
                  <h3 className="section-title">Products Created By Your Wallet</h3>
                  <ProductTable
                    rows={products.filter((p) => sameAddress(p.manufacturer, account))}
                    empty={account ? "No products originated by this wallet yet." : "Connect wallet to see your products."}
                  />
                </div>
              )}
            </section>
          )}

          {/* VIEW: SUPPLIER */}
          {activeRoleView === 'supplier' && (
            <section>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">SUPPLIER WORKSPACE</div>
                  <h2>Supply & Handoff Management</h2>
                  <p className="lead">Suppliers record quantity, location, timestamps, and quality notes for in-transit shipments.</p>
                </div>
              </div>

              {userRole !== 2 && (
                <div className="notice pending">
                  <span>ℹ️ Viewing Supplier perspective. To submit supply updates, register your wallet as <b>Supplier (Role 2)</b> under Role Management.</span>
                </div>
              )}

              <div className="split">
                <form onSubmit={submitSupply} className="panel form-stack">
                  <h3>Record Supply Checkpoint</h3>
                  <label>
                    Product ID *
                    <input type="number" min="1" required value={supplyForm.id} onChange={(e) => setSupplyForm({ ...supplyForm, id: e.target.value })} placeholder="Enter numeric ID" />
                  </label>
                  <div className="form-row">
                    <label>
                      Quantity *
                      <input type="number" min="1" required value={supplyForm.quantity} onChange={(e) => setSupplyForm({ ...supplyForm, quantity: e.target.value })} placeholder="100" />
                    </label>
                    <label>
                      Timestamp *
                      <input type="datetime-local" required value={supplyForm.timestamp} onChange={(e) => setSupplyForm({ ...supplyForm, timestamp: e.target.value })} />
                    </label>
                  </div>
                  <label>
                    Location Checkpoint *
                    <input required value={supplyForm.location} onChange={(e) => setSupplyForm({ ...supplyForm, location: e.target.value })} placeholder="e.g. Hamburg Port Terminal 4" />
                  </label>
                  <label>
                    Supply / Packaging Notes
                    <textarea value={supplyForm.notes} onChange={(e) => setSupplyForm({ ...supplyForm, notes: e.target.value })} placeholder="Condition, lot status, temperature logs..." />
                  </label>
                  <label>
                    Next Owner Address (Optional)
                    <input className="mono" value={supplyForm.nextOwner} onChange={(e) => setSupplyForm({ ...supplyForm, nextOwner: e.target.value })} placeholder="0x..." />
                  </label>
                  <button className="button button-primary full" disabled={loading || userRole !== 2}>
                    Submit Supply Checkpoint
                  </button>
                </form>

                <div className="context-card">
                  <span>ROLE INSTRUCTIONS</span>
                  <h3>Supplier Role Guidance</h3>
                  <p>When you submit a supply update, the contract sets the product status to <b>In Transit (1)</b> and appends your location and supply details to the immutable tracking step history.</p>
                </div>
              </div>
            </section>
          )}

          {/* VIEW: DELIVERY PERSON */}
          {activeRoleView === 'delivery' && (
            <section>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">DELIVERY WORKSPACE</div>
                  <h2>Assigned Deliveries & Logistics</h2>
                  <p className="lead">Delivery personnel update tracking status and transfer custody during transit.</p>
                </div>
              </div>

              {userRole !== 3 && (
                <div className="notice pending">
                  <span>ℹ️ Viewing Delivery perspective. To submit status changes, register your wallet as <b>Delivery Person (Role 3)</b> under Role Management.</span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="section-title">Shipments Assigned To Your Address</h3>
                <ProductTable rows={assignedDeliveries} empty="No delivery records assigned to this connected wallet." />
              </div>

              <form onSubmit={submitDelivery} className="panel form-stack narrow">
                <h3>Update Shipment Status</h3>
                <label>
                  Assigned Product *
                  <select required value={deliveryForm.id} onChange={(e) => setDeliveryForm({ ...deliveryForm, id: e.target.value })}>
                    <option value="">Select product...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        #{p.id} — {p.name} ({STATUSES[p.status]})
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  New Status *
                  <select value={deliveryForm.status} onChange={(e) => setDeliveryForm({ ...deliveryForm, status: Number(e.target.value) })}>
                    <option value="1">In Transit</option>
                    <option value="2">Delivered</option>
                  </select>
                </label>
                <label>
                  Current Location Checkpoint *
                  <input required value={deliveryForm.location} onChange={(e) => setDeliveryForm({ ...deliveryForm, location: e.target.value })} placeholder="e.g. Regional Distribution Hub" />
                </label>
                <label>
                  Transfer Ownership To Address (Optional)
                  <input className="mono" value={deliveryForm.nextOwner} onChange={(e) => setDeliveryForm({ ...deliveryForm, nextOwner: e.target.value })} placeholder="0x..." />
                </label>
                <button className="button button-primary full" disabled={loading || userRole !== 3}>
                  Submit Status Update
                </button>
              </form>
            </section>
          )}

          {/* VIEW: CUSTOMER / TRACE */}
          {activeRoleView === 'customer' && (
            <section>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">CUSTOMER PROVENANCE & VERIFICATION</div>
                  <h2>Trace Product Provenance</h2>
                  <p className="lead">Look up any product ID to view its complete, tamper-proof history on the blockchain.</p>
                </div>
              </div>

              <div className="searchbar">
                <input
                  type="number"
                  min="1"
                  value={lookupId}
                  onChange={(e) => setLookupId(e.target.value)}
                  placeholder="Enter product ID to lookup..."
                />
                <button className="button button-primary" onClick={() => lookup()} disabled={loading}>
                  Trace Provenance
                </button>
              </div>

              {lookupResult && (
                <div className="trace-layout">
                  <div className="panel product-identity">
                    <span className={`status status-${lookupResult.status}`}>{STATUSES[lookupResult.status]}</span>
                    <div className="eyebrow">PRODUCT #{lookupResult.id}</div>
                    <h2>{lookupResult.name}</h2>
                    <p>{lookupResult.description || 'No description provided.'}</p>
                    <dl>
                      <div>
                        <dt>Manufacturer</dt>
                        <dd>{short(lookupResult.manufacturer)}</dd>
                      </div>
                      <div>
                        <dt>Current Owner</dt>
                        <dd>{short(lookupResult.currentOwner)}</dd>
                      </div>
                      <div>
                        <dt>Delivery Person</dt>
                        <dd>{short(lookupResult.deliveryPerson)}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="panel">
                    <div className="eyebrow">IMMUTABLE ON-CHAIN STEPS</div>
                    <h3>Checkpoint History</h3>
                    {history.length === 0 ? (
                      <p className="text-muted">No history steps recorded for this product.</p>
                    ) : (
                      <div className="timeline">
                        {history.map((step, index) => (
                          <div className="timeline-item" key={`${step.timestamp}-${index}`}>
                            <i />
                            <div>
                              <strong>{STATUSES[step.status]}</strong>
                              <time>{step.timestamp}</time>
                              <p>{step.location}</p>
                              <small>Updated by: {short(step.updatedBy)}</small>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="split top-gap">
                <div className="panel form-stack">
                  <h3>Scan Product QR / Tag</h3>
                  <p className="hint">Use your camera or upload a tag image containing the product ID.</p>
                  <div className="camera">
                    <video ref={videoRef} autoPlay playsInline />
                    {!cameraActive && <span>Camera is off</span>}
                  </div>
                  <button className="button button-dark" onClick={cameraActive ? stopCamera : startCamera}>
                    {cameraActive ? 'Stop Camera' : 'Start Camera'}
                  </button>
                  <label className="upload">
                    Upload Tag / Image
                    <input type="file" accept="image/*" onChange={handleQrFile} />
                  </label>
                </div>

                <form onSubmit={confirmDelivery} className="panel form-stack">
                  <h3>Confirm Receipt (Customer)</h3>
                  <p className="hint">Finalize delivery by signing receipt on-chain.</p>
                  <label>
                    Product ID *
                    <input type="number" min="1" required value={confirmForm.id} onChange={(e) => setConfirmForm({ ...confirmForm, id: e.target.value })} placeholder="ID #" />
                  </label>
                  <label>
                    Receipt Location *
                    <input required value={confirmForm.location} onChange={(e) => setConfirmForm({ ...confirmForm, location: e.target.value })} placeholder="e.g. Tokyo Customer Center" />
                  </label>
                  <button className="button button-primary full" disabled={loading || userRole !== 4}>
                    Confirm Receipt On-Chain
                  </button>
                </form>
              </div>
            </section>
          )}

          {/* VIEW: ROLE MANAGEMENT */}
          {activeRoleView === 'register' && (
            <section className="panel narrow">
              <div className="eyebrow">ROLE MANAGEMENT</div>
              <h2>Manage On-Chain User Role</h2>
              <p className="lead">
                Every wallet address can register an operational role on the SupplyChain smart contract.
              </p>

              <div className="my-current-role-banner">
                <span>Current On-Chain Role:</span>
                <strong className="mono">{ROLES[userRole]}</strong>
              </div>

              {userRole === 0 ? (
                <form onSubmit={register}>
                  <p className="hint mb-4">Choose a role to register this address on-chain:</p>
                  <div className="role-grid">
                    {[1, 2, 3, 4].map((role) => (
                      <button
                        type="button"
                        key={role}
                        onClick={() => setRegistrationRole(role)}
                        className={registrationRole === role ? 'role-choice selected' : 'role-choice'}
                      >
                        <strong>{ROLES[role]}</strong>
                        <span>
                          {role === 1 ? 'Originate new product items' :
                           role === 2 ? 'Record supply & packaging details' :
                           role === 3 ? 'Update transit & assigned deliveries' :
                           'Verify history & confirm delivery receipt'}
                        </span>
                      </button>
                    ))}
                  </div>
                  <button className="button button-primary full" disabled={loading || !account}>
                    Register as {ROLES[registrationRole]}
                  </button>
                </form>
              ) : (
                <div className="p-4 border border-zinc-800 bg-zinc-900 mt-4 rounded">
                  <p className="text-sm text-zinc-300">
                    This wallet address is registered as <b>{ROLES[userRole]}</b>.
                  </p>
                  <p className="text-xs text-zinc-400 mt-2">
                    To test other roles, switch to another account in Remix VM (e.g. Account 2, Account 3) and connect that account.
                  </p>
                </div>
              )}
            </section>
          )}

          {/* VIEW: SEED DATA */}
          {activeRoleView === 'seed' && (
            <section className="panel narrow">
              <div className="eyebrow">AUTOMATED SAMPLE DATA</div>
              <h2>Seed 15 Sample Products</h2>
              <p className="lead">
                Populate the SupplyChain contract with 15 real-world sample products across various industries (Coffee, Solar Panels, Microchips, Olive Oil, Electric Vehicle Batteries, etc.).
              </p>

              {seedProgress && (
                <div className="p-4 bg-zinc-900 border border-amber-500/40 rounded mb-4">
                  <div className="flex justify-between text-xs text-amber-400 mb-1 font-bold">
                    <span>ADDING SAMPLE PRODUCTS...</span>
                    <span>{seedProgress.current} / {seedProgress.total}</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2 rounded overflow-hidden">
                    <div
                      className="bg-lime-400 h-full transition-all duration-300"
                      style={{ width: `${(seedProgress.current / seedProgress.total) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-zinc-300 mt-2 font-mono truncate">{seedProgress.name}</p>
                </div>
              )}

              <div className="form-stack">
                <button
                  className="button button-primary full text-base py-3"
                  onClick={seed15SampleProducts}
                  disabled={loading}
                >
                  ⚡ Execute Seed Script: Add 15 Sample Products
                </button>
                <p className="hint">
                  Note: A standalone script is also saved at <code>/scripts/seed_products.js</code>.
                </p>
              </div>

              <div className="mt-6 border-t border-zinc-800 pt-4">
                <h4 className="font-bold text-xs text-zinc-400 uppercase tracking-wider mb-2">Sample Products Batch List:</h4>
                <ol className="text-xs text-zinc-400 space-y-1 list-decimal list-inside font-mono">
                  {SAMPLE_PRODUCTS_DATA.map((p, idx) => (
                    <li key={idx}><strong className="text-zinc-200">{p.name}</strong> — {p.location}</li>
                  ))}
                </ol>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
