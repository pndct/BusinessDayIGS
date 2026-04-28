import React, { useState, useEffect, useRef } from "react";
import {
  ShoppingCart,
  ChefHat,
  Coffee,
  Utensils,
  Minus,
  Plus,
  Trash2,
  CheckCircle,
  ArrowLeft,
  Send,
  Lock,
  Clock,
  User,
  LogIn,
  CheckSquare,
  PlusCircle,
  Edit2,
  Image as ImageIcon,
  Save,
  X,
  Package,
  Square,
  Users,
  School,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Wallet,
  Upload,
  Maximize2,
  List,
  UserCheck,
  ToggleLeft,
  ToggleRight,
  LogOut,
  LayoutDashboard,
  Banknote,
  PieChart,
  Copy,
  Download,
  ArrowRight,
  Eye,
  EyeOff,
  DownloadCloud,
} from "lucide-react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signInWithCustomToken,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  increment,
  setDoc,
} from "firebase/firestore";

// --- KONFIGURASI FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyCtTKDNyZm4z1Raaon4zyZTur4LCufZ7E4",
  authDomain: "igsbdsd.firebaseapp.com",
  projectId: "igsbdsd",
  storageBucket: "igsbdsd.firebasestorage.app",
  messagingSenderId: "427654052653",
  appId: "1:427654052653:web:8f7cd34c6fd111323231a4",
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== "undefined" ? __app_id : "default-app-id";

// --- KONFIGURASI ADMIN ---
const STAND_ADMINS = [
  { username: "admin1", password: "kelas1", name: "Admin Kelas 1" },
  { username: "admin2", password: "kelas2", name: "Admin Kelas 2" },
  { username: "admin3", password: "kelas3", name: "Admin Kelas 3" },
  { username: "admin4", password: "kelas4", name: "Admin Kelas 4" },
  { username: "admin5", password: "kelas5", name: "Admin Kelas 5" },
  { username: "admin6", password: "kelas6", name: "Admin Kelas 6" },
];

const GENERAL_ADMIN = {
  username: "admin",
  password: "adminIGS2",
  name: "Admin General",
};

// --- DATA INITIAL SEEDING ---
const INITIAL_CLASSES_DATA = Array.from({ length: 12 }, (_, i) => ({
  id: `class_${i + 1}`,
  name: `Kelas ${i + 1}`,
  order: i + 1,
  isActive: true, // Default status aktif
}));

export default function App() {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState({});
  const [view, setView] = useState("landing");
  const invoiceRef = useRef(null);

  // Checkout State
  const [orderType, setOrderType] = useState("siswa");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [teacherUnit, setTeacherUnit] = useState("SD");
  const [orderNotes, setOrderNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [transferProof, setTransferProof] = useState(null);

  // Invoice State
  const [lastOrderInfo, setLastOrderInfo] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");

  // Data State
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);

  // Admin State
  const [activeAdmin, setActiveAdmin] = useState(null);
  const [adminCredentials, setAdminCredentials] = useState({
    username: "",
    password: "",
  });
  const [adminError, setAdminError] = useState("");
  const [adminTab, setAdminTab] = useState("orders");
  const [generalAdminTab, setGeneralAdminTab] = useState("students");

  // State untuk Laporan (Accordion)
  const [expandedReportId, setExpandedReportId] = useState(null);

  // Product Management State
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [currentProduct, setCurrentProduct] = useState({
    name: "",
    price: "",
    stock: "",
    category: "makanan",
    description: "",
    image: "",
  });
  const [editProductId, setEditProductId] = useState(null);

  // Student & Class Management State
  const [newStudentName, setNewStudentName] = useState("");
  const [editingClassId, setEditingClassId] = useState(null);
  const [tempClassName, setTempClassName] = useState("");
  const [expandedClassId, setExpandedClassId] = useState(null);

  // STATE IMPORT MASSAL
  const [bulkStudentNames, setBulkStudentNames] = useState("");
  const [showBulkFormId, setShowBulkFormId] = useState(null);
  const [isBulkImporting, setIsBulkImporting] = useState(false);

  // UI State
  const [expandedProductId, setExpandedProductId] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // --- AUTO-LOAD TAILWIND & HTML2CANVAS ---
  useEffect(() => {
    if (!document.querySelector('script[src*="tailwindcss"]')) {
      const script = document.createElement("script");
      script.src = "https://cdn.tailwindcss.com";
      script.async = true;
      document.head.appendChild(script);
    }
    if (!document.querySelector('script[src*="html2canvas"]')) {
      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  // --- FIREBASE AUTH ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (
          typeof __initial_auth_token !== "undefined" &&
          __initial_auth_token
        ) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth error:", error);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  // --- PERSIST ADMIN SESSION ---
  useEffect(() => {
    const storedAdmin = localStorage.getItem("igs_admin_session");
    if (storedAdmin) {
      try {
        const parsedAdmin = JSON.parse(storedAdmin);
        setActiveAdmin(parsedAdmin);
      } catch (e) {
        console.error("Gagal memuat sesi admin", e);
        localStorage.removeItem("igs_admin_session");
      }
    }
  }, []);

  // --- FETCH DATA ---
  useEffect(() => {
    if (!user) return;
    const unsubProducts = onSnapshot(
      collection(db, "artifacts", appId, "public", "data", "products"),
      (s) => setProducts(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsubOrders = onSnapshot(
      collection(db, "artifacts", appId, "public", "data", "orders"),
      (s) => {
        const data = s.docs.map((d) => ({ id: d.id, ...d.data() }));
        data.sort((a, b) => {
          const doneA = (a.items || []).every((i) => i.status === "completed");
          const doneB = (b.items || []).every((i) => i.status === "completed");
          if (doneA === doneB)
            return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
          return doneA ? 1 : -1;
        });
        setOrders(data);
      }
    );
    const unsubClasses = onSnapshot(
      collection(db, "artifacts", appId, "public", "data", "classes"),
      (s) => {
        const data = s.docs.map((d) => ({ id: d.id, ...d.data() }));
        data.sort((a, b) => a.order - b.order);
        setClasses(data);
      }
    );
    const unsubStudents = onSnapshot(
      collection(db, "artifacts", appId, "public", "data", "students"),
      (s) => {
        const data = s.docs.map((d) => ({ id: d.id, ...d.data() }));
        data.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        setStudents(data);
      }
    );
    return () => {
      unsubProducts();
      unsubOrders();
      unsubClasses();
      unsubStudents();
    };
  }, [user]);

  // --- LOGIC ---
  const addToCart = (item) => {
    const currentQty = cart[item.id]?.qty || 0;
    if (currentQty >= item.stock) return alert("Maaf, stok habis/maksimal!");
    setCart((prev) => ({
      ...prev,
      [item.id]: { ...item, qty: currentQty + 1 },
    }));
  };

  const removeFromCart = (itemId) => {
    setCart((prev) => {
      const newCart = { ...prev };
      if (newCart[itemId].qty > 1) newCart[itemId].qty -= 1;
      else delete newCart[itemId];
      return newCart;
    });
  };

  const getTotalPrice = () =>
    Object.values(cart || {}).reduce(
      (total, item) => total + (item.price || 0) * (item.qty || 0),
      0
    );
  const getTotalItems = () =>
    Object.values(cart || {}).reduce(
      (total, item) => total + (item.qty || 0),
      0
    );

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 500 * 1024) return alert("Maksimal 500KB.");
      const reader = new FileReader();
      reader.onloadend = () => setTransferProof(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // --- FUNGSI COPY TO CLIPBOARD ---
  const copyToClipboard = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand("copy");
      alert("Nomor rekening berhasil disalin!");
    } catch (err) {
      console.error("Gagal menyalin", err);
    }
    document.body.removeChild(textArea);
  };

  // --- FUNGSI DOWNLOAD STRUK (GAMBAR) ---
  const handleDownloadInvoice = async () => {
    if (!invoiceRef.current) return;
    try {
      if (!window.html2canvas) {
        alert(
          "Sistem sedang memuat pembuat gambar, silakan tunggu beberapa detik dan coba lagi."
        );
        return;
      }
      const canvas = await window.html2canvas(invoiceRef.current, {
        backgroundColor: "#ffffff", // Background putih
        scale: 2, // Kualitas resolusi tinggi
        useCORS: true, // Untuk memastikan gambar luar tidak error
      });
      const image = canvas.toDataURL("image/png", 1.0);
      const link = document.createElement("a");
      link.href = image;
      link.download = `Struk_Pesanan_IGS_${lastOrderInfo?.id || "Unknown"}.png`;
      link.click();
    } catch (err) {
      console.error("Gagal mendownload struk:", err);
      alert("Gagal mendownload struk.");
    }
  };

  // --- FUNGSI DOWNLOAD EXCEL (XLS) ---
  const downloadReport = () => {
    if (!orders || orders.length === 0)
      return alert("Belum ada data pesanan untuk didownload.");
    const groupedByStand = {};
    STAND_ADMINS.forEach((admin) => {
      groupedByStand[admin.name] = [];
    });
    groupedByStand["Lainnya"] = [];

    (orders || []).forEach((order) => {
      (order.items || []).forEach((item) => {
        const standName =
          STAND_ADMINS.find((a) => a.username === item.owner)?.name ||
          "Lainnya";
        const date = order.createdAt?.seconds
          ? new Date(order.createdAt.seconds * 1000)
          : new Date();
        groupedByStand[standName].push({
          date: date.toLocaleDateString("id-ID"),
          name: order.customer?.name || "-",
          classUnit: order.customer?.table || "-",
          product: item.name || "-",
          price: item.price || 0,
          qty: item.qty || 0,
          total: (item.price || 0) * (item.qty || 0),
          payment: order.customer?.payment === "transfer" ? "Transfer" : "Cash",
        });
      });
    });

    if (groupedByStand["Lainnya"]?.length === 0) {
      delete groupedByStand["Lainnya"];
    }

    const xmlHeader1 = '<?xml version="1.0"?>';
    const xmlHeader2 = '<?mso-application progid="Excel.Sheet"?>';

    let xmlContent = `${xmlHeader1}\n${xmlHeader2}\n<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">`;

    const escapeXml = (unsafe) =>
      unsafe
        ? unsafe.toString().replace(
            /[<>&'"]/g,
            (c) =>
              ({
                "<": "&lt;",
                ">": "&gt;",
                "&": "&amp;",
                "'": "&apos;",
                '"': "&quot;",
              }[c])
          )
        : "";

    Object.keys(groupedByStand)
      .sort()
      .forEach((sheetName) => {
        const rows = groupedByStand[sheetName] || [];
        let totalOmset = 0;
        const safeSheetName = escapeXml(sheetName.substring(0, 31));

        xmlContent += `<Worksheet ss:Name="${safeSheetName}"><Table><Column ss:Width="80"/><Column ss:Width="120"/><Column ss:Width="100"/><Column ss:Width="150"/><Column ss:Width="80"/><Column ss:Width="40"/><Column ss:Width="80"/><Column ss:Width="80"/><Row><Cell><Data ss:Type="String">Tanggal</Data></Cell><Cell><Data ss:Type="String">Nama Pemesan</Data></Cell><Cell><Data ss:Type="String">Kelas/Unit</Data></Cell><Cell><Data ss:Type="String">Produk</Data></Cell><Cell><Data ss:Type="String">Harga</Data></Cell><Cell><Data ss:Type="String">Qty</Data></Cell><Cell><Data ss:Type="String">Total</Data></Cell><Cell><Data ss:Type="String">Metode</Data></Cell></Row>`;

        rows.forEach((row) => {
          totalOmset += row.total;
          xmlContent += `<Row><Cell><Data ss:Type="String">${
            row.date
          }</Data></Cell><Cell><Data ss:Type="String">${escapeXml(
            row.name
          )}</Data></Cell><Cell><Data ss:Type="String">${escapeXml(
            row.classUnit
          )}</Data></Cell><Cell><Data ss:Type="String">${escapeXml(
            row.product
          )}</Data></Cell><Cell><Data ss:Type="Number">${
            row.price
          }</Data></Cell><Cell><Data ss:Type="Number">${
            row.qty
          }</Data></Cell><Cell><Data ss:Type="Number">${
            row.total
          }</Data></Cell><Cell><Data ss:Type="String">${
            row.payment
          }</Data></Cell></Row>`;
        });
        xmlContent += `<Row><Cell ss:Index="6"><Data ss:Type="String">TOTAL OMSET:</Data></Cell><Cell><Data ss:Type="Number">${totalOmset}</Data></Cell></Row></Table></Worksheet>`;
      });
    xmlContent += `</Workbook>`;

    const blob = new Blob([xmlContent], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const today = new Date().toISOString().split("T")[0];
    link.setAttribute("download", `Laporan_Keuangan_PerStand_IGS_${today}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- FUNGSI IMPORT MASSAL SISWA ---
  const handleBulkAddStudents = async (e, classId) => {
    e.preventDefault();
    if (!bulkStudentNames || !bulkStudentNames.trim()) return;

    setIsBulkImporting(true);
    const namesArray = bulkStudentNames
      .split("\n")
      .map((n) => n.trim())
      .filter((n) => n !== "");

    try {
      const promises = namesArray.map((name) => {
        return addDoc(
          collection(db, "artifacts", appId, "public", "data", "students"),
          {
            name: name,
            classId: classId,
            createdAt: serverTimestamp(),
          }
        );
      });
      await Promise.all(promises);
      setBulkStudentNames("");
      setShowBulkFormId(null);
      alert(`Berhasil mengimpor ${namesArray.length} siswa!`);
    } catch (error) {
      console.error("Error bulk import:", error);
      alert("Gagal mengimpor data. Coba lagi. Detail: " + error.message);
    } finally {
      setIsBulkImporting(false);
    }
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (orderType === "siswa" && (!selectedClassId || !selectedStudent))
      return alert("Pilih Kelas & Siswa");
    if (orderType === "guru" && !teacherName) return alert("Isi Nama");
    if (paymentMethod === "transfer" && !transferProof)
      return alert("Upload bukti transfer");

    setIsSubmitting(true);
    const className =
      (classes || []).find((c) => c.id === selectedClassId)?.name || "Kelas ?";
    const finalCustomer = {
      type: orderType,
      name: orderType === "siswa" ? selectedStudent : teacherName,
      table: orderType === "siswa" ? className : `Guru - ${teacherUnit}`,
      payment: paymentMethod,
      transferProof: paymentMethod === "transfer" ? transferProof : null,
      notes: orderNotes,
    };

    try {
      const orderRef = collection(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "orders"
      );
      const cartItems = Object.values(cart || {}).map((i) => ({
        ...i,
        status: "pending",
      }));
      const docRef = await addDoc(orderRef, {
        customer: finalCustomer,
        items: cartItems,
        totalPrice: getTotalPrice(),
        status: "pending",
        createdAt: serverTimestamp(),
        userId: user.uid,
      });

      // SIMPAN DATA INVOICE UNTUK DITAMPILKAN DI HALAMAN SUCCESS
      setLastOrderInfo({
        id: docRef.id.slice(0, 6).toUpperCase(),
        customer: finalCustomer,
        items: cartItems,
        totalPrice: getTotalPrice(),
        date: new Date(),
      });

      cartItems.forEach(async (item) => {
        const prodRef = doc(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "products",
          item.id
        );
        await updateDoc(prodRef, { stock: increment(-item.qty) });
      });

      setView("success");
      setCart({});
      setSelectedClassId("");
      setSelectedStudent("");
      setTeacherName("");
      setOrderNotes("");
      setTransferProof(null);
    } catch (err) {
      alert("Gagal pesan. Detail: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- ADMIN FUNCTIONS ---
  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (
      adminCredentials.username === GENERAL_ADMIN.username &&
      adminCredentials.password === GENERAL_ADMIN.password
    ) {
      const adminData = { ...GENERAL_ADMIN, role: "general" };
      setActiveAdmin(adminData);
      localStorage.setItem("igs_admin_session", JSON.stringify(adminData));
      setAdminError("");
      setView("general-admin");
      return;
    }
    const stand = STAND_ADMINS.find(
      (a) =>
        a.username === adminCredentials.username &&
        a.password === adminCredentials.password
    );
    if (stand) {
      const adminData = { ...stand, role: "stand" };
      setActiveAdmin(adminData);
      localStorage.setItem("igs_admin_session", JSON.stringify(adminData));
      setAdminError("");
      setView("admin");
    } else setAdminError("Username/Password Salah!");
  };

  const handleLogout = () => {
    setActiveAdmin(null);
    setAdminCredentials({ username: "", password: "" });
    localStorage.removeItem("igs_admin_session");
    setView("menu");
  };

  const seedInitialClasses = async () => {
    if (!classes || classes.length > 0) return;
    try {
      for (const cls of INITIAL_CLASSES_DATA) {
        await setDoc(
          doc(db, "artifacts", appId, "public", "data", "classes", cls.id),
          { name: cls.name, order: cls.order, isActive: true }
        );
      }
      alert("Kelas berhasil dibuat!");
    } catch (error) {
      alert(
        "Gagal membuat data kelas. Pastikan Firebase Rules Anda sudah mengizinkan penulisan. Detail: " +
          error.message
      );
    }
  };

  const handleUpdateClassStatus = async (classId, currentStatus) => {
    try {
      const newStatus = currentStatus === undefined ? false : !currentStatus;
      await updateDoc(
        doc(db, "artifacts", appId, "public", "data", "classes", classId),
        { isActive: newStatus }
      );
    } catch (error) {
      alert("Gagal update status kelas. Detail: " + error.message);
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!activeAdmin || activeAdmin.role !== "stand") return;
    try {
      const productData = {
        ...currentProduct,
        price: Number(currentProduct.price),
        stock: Number(currentProduct.stock),
        owner: activeAdmin.username,
        updatedAt: serverTimestamp(),
      };
      if (editProductId) {
        await updateDoc(
          doc(
            db,
            "artifacts",
            appId,
            "public",
            "data",
            "products",
            editProductId
          ),
          productData
        );
      } else {
        await addDoc(
          collection(db, "artifacts", appId, "public", "data", "products"),
          { ...productData, createdAt: serverTimestamp() }
        );
      }
      setIsEditingProduct(false);
      resetProductForm();
    } catch (error) {
      alert("Gagal menyimpan produk. Detail: " + error.message);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (confirm("Hapus produk?")) {
      try {
        await deleteDoc(
          doc(db, "artifacts", appId, "public", "data", "products", id)
        );
      } catch (error) {
        alert("Gagal menghapus produk. Detail: " + error.message);
      }
    }
  };

  const resetProductForm = () => {
    setCurrentProduct({
      name: "",
      price: "",
      stock: "",
      category: "makanan",
      description: "",
      image: "",
    });
    setEditProductId(null);
  };

  const toggleItemStatus = async (orderId, orderItems, itemIndex) => {
    const newItems = [...(orderItems || [])];
    if (!newItems[itemIndex]) return;
    const currentStatus = newItems[itemIndex].status || "pending";
    newItems[itemIndex].status =
      currentStatus === "completed" ? "pending" : "completed";
    try {
      await updateDoc(
        doc(db, "artifacts", appId, "public", "data", "orders", orderId),
        { items: newItems }
      );
    } catch (error) {
      alert("Gagal mengupdate status item. Detail: " + error.message);
    }
  };

  const deleteOrder = async (id) => {
    if (confirm("Hapus pesanan permanen?")) {
      try {
        await deleteDoc(
          doc(db, "artifacts", appId, "public", "data", "orders", id)
        );
      } catch (error) {
        alert("Gagal menghapus pesanan. Detail: " + error.message);
      }
    }
  };

  const handleDeleteStudent = async (id) => {
    if (confirm("Hapus data siswa ini?")) {
      try {
        await deleteDoc(
          doc(db, "artifacts", appId, "public", "data", "students", id)
        );
      } catch (error) {
        alert("Gagal menghapus siswa. Detail: " + error.message);
      }
    }
  };

  const formatRupiah = (n) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(n || 0);
  const getAdminProducts = () =>
    (products || []).filter((p) => p.owner === activeAdmin?.username);
  const getStudentsByClassId = (clsId) =>
    (students || []).filter((s) => s.classId === clsId);

  const calculateStandRevenue = (adminUsername) => {
    let totalRevenue = 0;
    let productSales = {};

    (orders || []).forEach((order) => {
      (order.items || []).forEach((item) => {
        if (item.owner === adminUsername) {
          const revenue = (item.price || 0) * (item.qty || 0);
          totalRevenue += revenue;
          if (item.name) {
            if (!productSales[item.name]) {
              productSales[item.name] = { qty: 0, revenue: 0 };
            }
            productSales[item.name].qty += item.qty || 0;
            productSales[item.name].revenue += revenue;
          }
        }
      });
    });

    return { totalRevenue, productSales };
  };

  // --- VIEW RENDERS ---

  const renderLanding = () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-black flex flex-col items-center justify-center p-6 text-white relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-purple-600 rounded-full blur-3xl opacity-30 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-indigo-600 rounded-full blur-3xl opacity-30 animate-pulse delay-1000"></div>

      <div className="z-10 text-center max-w-md space-y-8 animate-fade-in">
        <div className="mb-6">
          <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center mx-auto mb-4 border border-white/20 shadow-2xl rotate-3 hover:rotate-6 transition duration-500">
            <img
              src="https://i.imgur.com/dsAGVyl.png"
              alt="Logo"
              className="w-16 h-16 object-contain drop-shadow-md"
            />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-200 to-indigo-200">
            IGS Business Day
          </h1>
          <p className="text-lg text-purple-200 mt-2 font-light">
            Healthy Bites, Happy Life
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/10 shadow-xl relative transform hover:scale-105 transition-transform duration-300">
          <div className="absolute -top-3 -left-3 text-4xl text-purple-400 opacity-50">
            ❝
          </div>
          <p className="text-sm italic leading-relaxed text-gray-200">
            "Pedagang yang jujur dan amanah akan dikumpulkan bersama para nabi,
            orang-orang shiddiq, dan syuhada."
          </p>
          <p className="text-xs font-bold text-purple-300 mt-3 text-right">
            - HR. Tirmidzi
          </p>
          <div className="absolute -bottom-3 -right-3 text-4xl text-purple-400 opacity-50">
            ❞
          </div>
        </div>

        <button
          onClick={() => setView("menu")}
          className="group relative inline-flex items-center justify-center px-8 py-3 text-lg font-bold text-white transition-all duration-200 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-600 hover:from-purple-500 hover:to-indigo-500 hover:scale-105 shadow-lg shadow-purple-600/30"
        >
          Mulai Belanja{" "}
          <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>

        <p className="text-xs text-white/30 mt-8">
          © 2025 Islamic Global School
        </p>
      </div>
    </div>
  );

  const renderLogin = () => (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-6">
      <div className="bg-white/20 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/30 max-w-sm w-full relative">
        <button
          onClick={() => setView("menu")}
          className="absolute top-4 left-4 text-white hover:text-gray-200"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white text-center mb-6">
          Login Pengelola
        </h2>
        <form onSubmit={handleAdminLogin} className="space-y-4">
          <input
            type="text"
            value={adminCredentials.username}
            onChange={(e) =>
              setAdminCredentials({
                ...adminCredentials,
                username: e.target.value,
              })
            }
            className="w-full px-4 py-2 rounded-xl bg-white/40 border border-white/30 text-white placeholder-white/70 outline-none"
            placeholder="Username"
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={adminCredentials.password}
              onChange={(e) =>
                setAdminCredentials({
                  ...adminCredentials,
                  password: e.target.value,
                })
              }
              className="w-full px-4 py-2 rounded-xl bg-white/40 border border-white/30 text-white placeholder-white/70 outline-none pr-10"
              placeholder="Password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          {adminError && (
            <div className="text-red-200 text-sm text-center font-bold">
              {adminError}
            </div>
          )}
          <button className="w-full bg-purple-900 text-white py-3 rounded-xl font-bold hover:bg-purple-950 transition">
            Masuk
          </button>
        </form>
      </div>
    </div>
  );

  const renderGeneralAdmin = () => {
    let grandTotalRevenue = 0;
    const standReports = STAND_ADMINS.map((admin) => {
      const { totalRevenue, productSales } = calculateStandRevenue(
        admin.username
      );
      grandTotalRevenue += totalRevenue;
      return { ...admin, totalRevenue, productSales };
    });

    return (
      <div className="max-w-md mx-auto p-4 space-y-4 pt-6">
        <div className="flex p-1 gap-2 mb-4 bg-slate-200 rounded-xl">
          <button
            onClick={() => setGeneralAdminTab("students")}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${
              generalAdminTab === "students"
                ? "bg-slate-800 text-white shadow"
                : "text-slate-600 hover:bg-slate-300"
            }`}
          >
            Data Siswa
          </button>
          <button
            onClick={() => setGeneralAdminTab("orders")}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${
              generalAdminTab === "orders"
                ? "bg-slate-800 text-white shadow"
                : "text-slate-600 hover:bg-slate-300"
            }`}
          >
            Semua Pesanan
          </button>
          <button
            onClick={() => setGeneralAdminTab("finance")}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${
              generalAdminTab === "finance"
                ? "bg-slate-800 text-white shadow"
                : "text-slate-600 hover:bg-slate-300"
            }`}
          >
            Keuangan
          </button>
        </div>

        {generalAdminTab === "students" && (
          <div className="space-y-3">
            {(!classes || classes.length === 0) && (
              <button
                onClick={seedInitialClasses}
                className="bg-orange-600 text-white px-4 py-2 rounded w-full"
              >
                Buat Data Kelas Awal
              </button>
            )}
            {(classes || []).map((cls) => {
              const classStudents = getStudentsByClassId(cls.id) || [];
              const isExp = expandedClassId === cls.id;
              const isEdit = editingClassId === cls.id;
              const isActive = cls.isActive !== false;

              return (
                <div
                  key={cls.id}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
                >
                  <div
                    className={`p-4 flex justify-between items-center cursor-pointer ${
                      isExp ? "bg-slate-50" : ""
                    }`}
                    onClick={() =>
                      !isEdit && setExpandedClassId(isExp ? null : cls.id)
                    }
                  >
                    <div className="flex gap-2 items-center flex-1">
                      {isEdit ? (
                        <div
                          className="flex gap-2 w-full"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            autoFocus
                            value={tempClassName}
                            onChange={(e) => setTempClassName(e.target.value)}
                            className="flex-1 border p-1 rounded text-sm"
                          />
                          <button
                            onClick={async () => {
                              try {
                                await updateDoc(
                                  doc(
                                    db,
                                    "artifacts",
                                    appId,
                                    "public",
                                    "data",
                                    "classes",
                                    cls.id
                                  ),
                                  { name: tempClassName }
                                );
                                setEditingClassId(null);
                              } catch (e) {
                                alert("Gagal edit kelas: " + e.message);
                              }
                            }}
                            className="bg-green-500 text-white p-1 rounded"
                          >
                            <CheckSquare className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span
                            className={`font-bold ${
                              isActive
                                ? "text-slate-800"
                                : "text-slate-400 line-through"
                            }`}
                          >
                            {cls.name}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingClassId(cls.id);
                              setTempClassName(cls.name);
                            }}
                            className="p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded"
                            title="Edit Nama Kelas"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateClassStatus(cls.id, cls.isActive);
                        }}
                        className={`p-1 rounded ${
                          isActive
                            ? "text-green-600 hover:bg-green-50"
                            : "text-gray-400 hover:bg-gray-100"
                        }`}
                        title={
                          isActive ? "Nonaktifkan Kelas" : "Aktifkan Kelas"
                        }
                      >
                        {isActive ? (
                          <ToggleRight className="w-6 h-6" />
                        ) : (
                          <ToggleLeft className="w-6 h-6" />
                        )}
                      </button>

                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-slate-200 px-2 py-1 rounded-full">
                          {classStudents.length} Siswa
                        </span>
                        {isExp ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </div>

                  {isExp && (
                    <div className="p-3 bg-slate-50 border-t">
                      <div className="space-y-2 mb-4">
                        {classStudents.length === 0 ? (
                          <p className="text-center text-xs text-slate-400 py-2 italic">
                            Belum ada siswa di kelas ini.
                          </p>
                        ) : (
                          classStudents.map((student) => (
                            <div
                              key={student.id}
                              className="flex justify-between items-center bg-white p-2 rounded border border-slate-200 shadow-sm"
                            >
                              <span className="text-sm font-medium text-slate-700">
                                {student.name}
                              </span>
                              <button
                                onClick={() => handleDeleteStudent(student.id)}
                                className="text-red-300 hover:text-red-500 p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="flex flex-col gap-2 mt-2 border-t border-slate-200 pt-3">
                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
                            if (!newStudentName) return;
                            try {
                              await addDoc(
                                collection(
                                  db,
                                  "artifacts",
                                  appId,
                                  "public",
                                  "data",
                                  "students"
                                ),
                                {
                                  name: newStudentName,
                                  classId: cls.id,
                                  createdAt: serverTimestamp(),
                                }
                              );
                              setNewStudentName("");
                            } catch (err) {
                              alert("Gagal menambah siswa: " + err.message);
                            }
                          }}
                          className="flex gap-2"
                        >
                          <input
                            value={newStudentName}
                            onChange={(e) => setNewStudentName(e.target.value)}
                            placeholder="Nama Siswa"
                            className="flex-1 p-2 text-sm border rounded"
                          />
                          <button className="bg-purple-600 text-white p-2 rounded">
                            <Plus className="w-4 h-4" />
                          </button>
                        </form>

                        <button
                          onClick={() =>
                            setShowBulkFormId(
                              showBulkFormId === cls.id ? null : cls.id
                            )
                          }
                          className="text-xs text-purple-600 font-bold self-start hover:underline mt-1"
                        >
                          {showBulkFormId === cls.id
                            ? "- Tutup Impor Massal"
                            : "+ Impor Massal (Copas dari Excel)"}
                        </button>

                        {showBulkFormId === cls.id && (
                          <div className="bg-purple-50 p-3 rounded-lg border border-purple-100 animate-fade-in mt-1">
                            <label className="block text-xs font-bold text-purple-800 mb-1">
                              Paste daftar nama siswa ke bawah (1 baris 1 nama):
                            </label>
                            <textarea
                              rows="4"
                              className="w-full p-2 text-sm border border-purple-200 rounded focus:outline-none focus:ring-2 focus:ring-purple-400"
                              placeholder="Budi&#10;Andi&#10;Siti..."
                              value={bulkStudentNames}
                              onChange={(e) =>
                                setBulkStudentNames(e.target.value)
                              }
                            />
                            <button
                              onClick={(e) => handleBulkAddStudents(e, cls.id)}
                              disabled={
                                isBulkImporting ||
                                !bulkStudentNames ||
                                !bulkStudentNames.trim()
                              }
                              className="mt-2 w-full bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-2 rounded transition disabled:opacity-50"
                            >
                              {isBulkImporting
                                ? "Memproses..."
                                : "Simpan Semua Siswa"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {generalAdminTab === "orders" && (
          <div className="space-y-4">
            {!orders || orders.length === 0 ? (
              <p className="text-center text-slate-500 py-10">
                Belum ada pesanan masuk.
              </p>
            ) : (
              (orders || []).map((order) => {
                const allDone = (order.items || []).every(
                  (i) => i.status === "completed"
                );
                const isGuru = order.customer?.type === "guru";

                let cardStyle = "bg-white border-slate-200";
                if (allDone) {
                  cardStyle = "bg-green-50 border-green-200";
                } else if (isGuru) {
                  cardStyle = "bg-orange-50 border-orange-200";
                }

                return (
                  <div
                    key={order.id}
                    className={`p-4 rounded-xl shadow border relative ${cardStyle}`}
                  >
                    <div className="flex justify-between mb-3">
                      <div>
                        <h3
                          className={`font-bold flex gap-2 ${
                            isGuru ? "text-orange-900" : "text-slate-800"
                          }`}
                        >
                          {isGuru ? (
                            <GraduationCap className="w-4 h-4" />
                          ) : (
                            <User className="w-4 h-4" />
                          )}
                          {order.customer?.name}
                        </h3>
                        <div className="text-xs text-slate-500 mt-1 flex gap-2">
                          <span
                            className={`font-bold px-2 py-0.5 rounded ${
                              isGuru
                                ? "bg-orange-200 text-orange-800"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {order.customer?.table}
                          </span>
                          <span>
                            {order.createdAt?.seconds
                              ? new Date(
                                  order.createdAt.seconds * 1000
                                ).toLocaleTimeString()
                              : "-"}
                          </span>
                        </div>
                        {order.customer?.payment && (
                          <div
                            className={`mt-1 text-xs font-bold px-2 py-0.5 rounded w-fit flex items-center gap-1 ${
                              order.customer.payment === "transfer"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {order.customer.payment === "transfer" ? (
                              <>
                                <CreditCard className="w-3 h-3" /> Transfer BSI
                              </>
                            ) : (
                              <>
                                <Wallet className="w-3 h-3" /> Cash
                              </>
                            )}
                          </div>
                        )}
                        {order.customer?.transferProof && (
                          <p
                            onClick={() =>
                              setPreviewImage(order.customer.transferProof)
                            }
                            className="text-[10px] text-blue-600 underline mt-1 cursor-pointer font-bold"
                          >
                            Lihat Bukti Transfer
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() =>
                          confirm("Hapus pesanan ini secara permanen?") &&
                          deleteDoc(
                            doc(
                              db,
                              "artifacts",
                              appId,
                              "public",
                              "data",
                              "orders",
                              order.id
                            )
                          )
                        }
                        className="bg-red-100 p-2 rounded-full hover:bg-red-200"
                      >
                        <Trash2 className="w-5 h-5 text-red-600" />
                      </button>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2 text-sm space-y-2 border border-slate-100">
                      {(order.items || []).map((item, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center p-2 rounded"
                        >
                          <span className="text-slate-700">
                            <b>{item.qty}x</b> {item.name}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded font-bold ${
                              item.status === "completed"
                                ? "bg-green-200 text-green-800"
                                : "bg-yellow-200 text-yellow-800"
                            }`}
                          >
                            {item.status === "completed" ? "Selesai" : "Proses"}
                          </span>
                        </div>
                      ))}
                      {order.customer?.notes && (
                        <div className="text-xs text-orange-600 italic border-t border-slate-200 pt-1">
                          "{order.customer.notes}"
                        </div>
                      )}
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-800">
                      <span>Total</span>
                      <span>{formatRupiah(order.totalPrice)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {generalAdminTab === "finance" && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6 text-white shadow-lg relative">
              <p className="text-slate-400 text-sm font-medium mb-1">
                Total Omset Acara
              </p>
              <h2 className="text-3xl font-bold tracking-tight">
                {formatRupiah(grandTotalRevenue)}
              </h2>
              <p className="text-xs text-slate-400 mt-2 bg-white/10 w-fit px-2 py-1 rounded">
                Update Realtime
              </p>

              <button
                onClick={downloadReport}
                className="absolute top-6 right-6 bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg shadow-lg transition flex items-center gap-2 text-sm font-bold"
                title="Download Laporan Excel (XLS) Per Stand"
              >
                <Download className="w-5 h-5" />{" "}
                <span className="hidden sm:inline">Download XLS</span>
              </button>
            </div>

            <h3 className="font-bold text-slate-800 mt-6 mb-2 flex items-center gap-2">
              <PieChart className="w-5 h-5" /> Rincian Per Stand
            </h3>

            <div className="space-y-3">
              {(standReports || []).map((report) => {
                const isExpanded = expandedReportId === report.username;
                const salesKeys = Object.keys(report.productSales || {});
                return (
                  <div
                    key={report.username}
                    className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
                  >
                    <div
                      className={`p-4 flex justify-between items-center cursor-pointer transition-colors ${
                        isExpanded ? "bg-slate-50" : "hover:bg-slate-50"
                      }`}
                      onClick={() =>
                        setExpandedReportId(isExpanded ? null : report.username)
                      }
                    >
                      <div>
                        <h4 className="font-bold text-slate-800">
                          {report.name}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {salesKeys.length} Produk Terjual
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          {formatRupiah(report.totalRevenue)}
                        </p>
                        <div className="flex justify-end mt-1">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50 p-3">
                        <table className="w-full text-sm text-left text-slate-600">
                          <thead className="text-xs text-slate-400 uppercase bg-slate-100 border-b">
                            <tr>
                              <th className="px-2 py-2">Produk</th>
                              <th className="px-2 py-2 text-center">Qty</th>
                              <th className="px-2 py-2 text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {salesKeys.length === 0 ? (
                              <tr>
                                <td
                                  colSpan="3"
                                  className="text-center py-3 italic text-slate-400"
                                >
                                  Belum ada penjualan.
                                </td>
                              </tr>
                            ) : (
                              Object.entries(report.productSales || {}).map(
                                ([prodName, data]) => (
                                  <tr
                                    key={prodName}
                                    className="border-b border-slate-100 last:border-0"
                                  >
                                    <td className="px-2 py-2 font-medium">
                                      {prodName}
                                    </td>
                                    <td className="px-2 py-2 text-center">
                                      {data.qty}
                                    </td>
                                    <td className="px-2 py-2 text-right font-medium text-slate-800">
                                      {formatRupiah(data.revenue)}
                                    </td>
                                  </tr>
                                )
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderStandAdmin = () => {
    const { totalRevenue, productSales } = calculateStandRevenue(
      activeAdmin?.username
    );
    const salesKeys = Object.keys(productSales || {});

    return (
      <div className="max-w-md mx-auto p-4 pb-24 pt-6">
        <div className="flex gap-2 mb-4 bg-white/20 p-1 rounded-xl">
          <button
            onClick={() => setAdminTab("orders")}
            className={`flex-1 py-2 rounded-lg font-bold text-sm transition ${
              adminTab === "orders"
                ? "bg-white text-purple-900 shadow"
                : "text-white hover:bg-white/20"
            }`}
          >
            Pesanan
          </button>
          <button
            onClick={() => setAdminTab("products")}
            className={`flex-1 py-2 rounded-lg font-bold text-sm transition ${
              adminTab === "products"
                ? "bg-white text-purple-900 shadow"
                : "text-white hover:bg-white/20"
            }`}
          >
            Produk
          </button>
          <button
            onClick={() => setAdminTab("finance")}
            className={`flex-1 py-2 rounded-lg font-bold text-sm transition ${
              adminTab === "finance"
                ? "bg-white text-purple-900 shadow"
                : "text-white hover:bg-white/20"
            }`}
          >
            Laporan
          </button>
        </div>

        {adminTab === "orders" && (
          <div className="space-y-4">
            {!orders || orders.length === 0 ? (
              <div className="text-center py-10 text-white/80">
                <ChefHat className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="font-medium">Belum ada pesanan.</p>
              </div>
            ) : (
              (orders || []).map((order) => {
                const allDone = (order.items || []).every(
                  (i) => i.status === "completed"
                );
                const isGuru = order.customer?.type === "guru";

                let cardStyle = "bg-white/90 border-white/50";
                if (allDone) {
                  cardStyle = "bg-green-100/90 border-green-300";
                } else if (isGuru) {
                  cardStyle = "bg-orange-100/90 border-orange-300";
                }

                return (
                  <div
                    key={order.id}
                    className={`p-4 rounded-2xl shadow-xl border relative ${cardStyle}`}
                  >
                    <div className="flex justify-between mb-3">
                      <div>
                        <h3
                          className={`font-bold flex gap-2 ${
                            isGuru ? "text-orange-900" : "text-purple-900"
                          }`}
                        >
                          {isGuru ? (
                            <GraduationCap className="w-4 h-4" />
                          ) : (
                            <User className="w-4 h-4" />
                          )}
                          {order.customer?.name}
                        </h3>
                        <div className="text-xs text-gray-600 mt-1 flex gap-2">
                          <span
                            className={`font-bold px-2 py-0.5 rounded ${
                              isGuru
                                ? "bg-orange-200 text-orange-800"
                                : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {order.customer?.table}
                          </span>
                          <span>
                            {order.createdAt?.seconds
                              ? new Date(
                                  order.createdAt.seconds * 1000
                                ).toLocaleTimeString()
                              : "-"}
                          </span>
                        </div>
                        {order.customer?.payment && (
                          <div
                            className={`mt-1 text-xs font-bold px-2 py-0.5 rounded w-fit flex items-center gap-1 ${
                              order.customer.payment === "transfer"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {order.customer.payment === "transfer" ? (
                              <>
                                <CreditCard className="w-3 h-3" /> Transfer BSI
                              </>
                            ) : (
                              <>
                                <Wallet className="w-3 h-3" /> Cash
                              </>
                            )}
                          </div>
                        )}
                        {order.customer?.transferProof && (
                          <p
                            onClick={() =>
                              setPreviewImage(order.customer.transferProof)
                            }
                            className="text-[10px] text-blue-600 underline mt-1 cursor-pointer font-bold"
                          >
                            Lihat Bukti Transfer
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="bg-white/50 rounded-lg p-2 text-sm space-y-2">
                      {(order.items || []).map((item, idx) => {
                        const isMine = item.owner === activeAdmin?.username;
                        const done = item.status === "completed";
                        return (
                          <div
                            key={idx}
                            className={`flex justify-between items-center p-2 rounded ${
                              isMine ? "bg-purple-50" : "opacity-50"
                            }`}
                          >
                            <span>
                              <b>{item.qty}x</b> {item.name}
                            </span>
                            {isMine && (
                              <button
                                onClick={async () => {
                                  const newItems = [...(order.items || [])];
                                  newItems[idx].status = done
                                    ? "pending"
                                    : "completed";
                                  await updateDoc(
                                    doc(
                                      db,
                                      "artifacts",
                                      appId,
                                      "public",
                                      "data",
                                      "orders",
                                      order.id
                                    ),
                                    { items: newItems }
                                  );
                                }}
                                className={`px-2 py-1 rounded text-xs font-bold ${
                                  done
                                    ? "bg-green-500 text-white"
                                    : "bg-white border"
                                }`}
                              >
                                {done ? "Selesai" : "Proses"}
                              </button>
                            )}
                          </div>
                        );
                      })}
                      {order.customer?.notes && (
                        <div className="text-xs text-orange-600 italic border-t pt-1">
                          "{order.customer.notes}"
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {adminTab === "products" && (
          <div className="space-y-4">
            {!isEditingProduct && (
              <button
                onClick={() => {
                  setIsEditingProduct(true);
                  resetProductForm();
                }}
                className="w-full py-3 bg-white/20 border-2 border-dashed border-white/50 rounded-2xl text-white font-bold flex justify-center gap-2"
              >
                <PlusCircle /> Tambah Produk
              </button>
            )}
            {isEditingProduct && (
              <div className="bg-white/90 p-4 rounded-2xl shadow-xl animate-fade-in space-y-3">
                <div className="flex justify-between">
                  <h3 className="font-bold text-purple-900">Editor Produk</h3>
                  <button onClick={() => setIsEditingProduct(false)}>
                    <X className="text-gray-400" />
                  </button>
                </div>
                <input
                  placeholder="Nama Produk"
                  className="w-full p-2 border rounded"
                  value={currentProduct.name}
                  onChange={(e) =>
                    setCurrentProduct({
                      ...currentProduct,
                      name: e.target.value,
                    })
                  }
                />

                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs font-bold text-gray-500 mb-1 block">
                      Harga (Rp)
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      className="w-full p-2 border rounded"
                      value={currentProduct.price}
                      onChange={(e) =>
                        setCurrentProduct({
                          ...currentProduct,
                          price: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-bold text-gray-500 mb-1 block">
                      Stok Awal
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      className="w-full p-2 border rounded"
                      value={currentProduct.stock}
                      onChange={(e) =>
                        setCurrentProduct({
                          ...currentProduct,
                          stock: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">
                    Kategori
                  </label>
                  <select
                    className="w-full p-2 border rounded"
                    value={currentProduct.category}
                    onChange={(e) =>
                      setCurrentProduct({
                        ...currentProduct,
                        category: e.target.value,
                      })
                    }
                  >
                    <option value="makanan">Makanan</option>
                    <option value="minuman">Minuman</option>
                  </select>
                </div>

                <textarea
                  placeholder="Deskripsi Singkat"
                  className="w-full p-2 border rounded"
                  rows="2"
                  value={currentProduct.description}
                  onChange={(e) =>
                    setCurrentProduct({
                      ...currentProduct,
                      description: e.target.value,
                    })
                  }
                />

                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">
                    URL Gambar
                  </label>
                  <div className="relative">
                    <ImageIcon className="absolute top-2.5 left-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="https://..."
                      className="w-full pl-10 p-2 border rounded text-sm"
                      value={currentProduct.image}
                      onChange={(e) =>
                        setCurrentProduct({
                          ...currentProduct,
                          image: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <button
                  onClick={handleSaveProduct}
                  className="w-full bg-purple-700 text-white py-2 rounded font-bold"
                >
                  Simpan
                </button>
              </div>
            )}
            {getAdminProducts().map((p) => (
              <div
                key={p.id}
                className="bg-white/40 p-3 rounded-2xl flex gap-3 items-center"
              >
                <img
                  src={p.image}
                  className="w-16 h-16 rounded object-cover cursor-pointer"
                  onClick={() => setPreviewImage(p.image)}
                />
                <div className="flex-1">
                  <h4 className="font-bold">{p.name}</h4>
                  <div className="text-xs">
                    {formatRupiah(p.price)} | Stok: {p.stock}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setEditProductId(p.id);
                      setCurrentProduct(p);
                      setIsEditingProduct(true);
                    }}
                  >
                    <Edit2 className="w-4 h-4 text-blue-600" />
                  </button>
                  <button onClick={() => handleDeleteProduct(p.id)}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {adminTab === "finance" && (
          <div className="bg-white/90 backdrop-blur-xl p-4 rounded-2xl shadow-xl space-y-4">
            <div className="text-center border-b pb-4 border-slate-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                Total Pendapatan Kelas
              </p>
              <h2 className="text-3xl font-extrabold text-green-600 mt-1">
                {formatRupiah(totalRevenue)}
              </h2>
            </div>

            <div>
              <h3 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2">
                <Banknote className="w-4 h-4" /> Rincian Penjualan Produk
              </h3>
              <div className="overflow-hidden rounded-lg border border-gray-100">
                <table className="w-full text-sm text-left text-gray-600">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                    <tr>
                      <th className="px-3 py-2">Produk</th>
                      <th className="px-3 py-2 text-center">Qty</th>
                      <th className="px-3 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesKeys.length === 0 ? (
                      <tr>
                        <td
                          colSpan="3"
                          className="text-center py-4 italic text-gray-400"
                        >
                          Belum ada data penjualan.
                        </td>
                      </tr>
                    ) : (
                      Object.entries(productSales || {}).map(([name, data]) => (
                        <tr
                          key={name}
                          className="border-b border-gray-50 last:border-0 hover:bg-gray-50"
                        >
                          <td className="px-3 py-2 font-medium">{name}</td>
                          <td className="px-3 py-2 text-center">{data.qty}</td>
                          <td className="px-3 py-2 text-right font-medium text-gray-800">
                            {formatRupiah(data.revenue)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCheckout = () => (
    <div className="max-w-md mx-auto p-4 space-y-6 pt-6">
      <div className="bg-white/40 p-4 rounded-2xl shadow-xl border border-white/50">
        <h3 className="font-bold text-purple-900 mb-2 border-b pb-2">
          Ringkasan
        </h3>
        {Object.values(cart || {}).map((i) => (
          <div key={i.id} className="flex justify-between text-sm py-1">
            <span>
              {i.qty}x {i.name}
            </span>
            <span className="font-bold">
              {formatRupiah((i.price || 0) * (i.qty || 0))}
            </span>
          </div>
        ))}
        <div className="mt-2 pt-2 border-t flex justify-between font-bold text-purple-900">
          <span>Total</span>
          <span>{formatRupiah(getTotalPrice())}</span>
        </div>
      </div>
      <form
        onSubmit={handleSubmitOrder}
        className="bg-white/40 p-4 rounded-2xl shadow-xl border border-white/50 space-y-4"
      >
        <div className="flex bg-white/40 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setOrderType("siswa")}
            className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition ${
              orderType === "siswa"
                ? "bg-purple-700 text-white shadow-md"
                : "text-purple-900 hover:bg-white/30"
            }`}
          >
            <Users className="w-4 h-4" /> Siswa
          </button>
          <button
            type="button"
            onClick={() => setOrderType("guru")}
            className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition ${
              orderType === "guru"
                ? "bg-orange-600 text-white shadow-md"
                : "text-orange-900 hover:bg-white/30"
            }`}
          >
            <GraduationCap className="w-4 h-4" /> Guru/Staff
          </button>
        </div>
        {orderType === "siswa" ? (
          <>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setSelectedStudent("");
              }}
              className="w-full p-2 rounded-xl bg-white/60"
            >
              <option value="">-- Pilih Kelas --</option>
              {(classes || [])
                .filter((c) => c.isActive !== false)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              disabled={!selectedClassId}
              className="w-full p-2 rounded-xl bg-white/60"
            >
              <option value="">-- Pilih Nama --</option>
              {getStudentsByClassId(selectedClassId).map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </>
        ) : (
          <>
            <input
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              placeholder="Nama Lengkap"
              className="w-full p-2 rounded-xl bg-white/60"
            />
            <select
              value={teacherUnit}
              onChange={(e) => setTeacherUnit(e.target.value)}
              className="w-full p-2 rounded-xl bg-white/60"
            >
              <option value="PAUD">PAUD</option>
              <option value="SD">SD</option>
              <option value="SMP">SMP</option>
              <option value="UMUM">UMUM</option>
            </select>
          </>
        )}
        <textarea
          value={orderNotes}
          onChange={(e) => setOrderNotes(e.target.value)}
          placeholder="Catatan..."
          className="w-full p-2 rounded-xl bg-white/60"
          rows="2"
        />

        <div className="space-y-4">
          <h3 className="font-bold text-purple-900 text-sm mb-2 flex items-center gap-2 mt-4">
            <CreditCard className="w-4 h-4" /> Metode Pembayaran
          </h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod("cash")}
              className={`flex-1 p-2 rounded-xl border flex flex-col items-center text-xs font-bold ${
                paymentMethod === "cash"
                  ? "bg-green-100 border-green-500 text-green-800"
                  : "bg-white/60"
              }`}
            >
              <Wallet className="w-4 h-4 mb-1" /> Cash
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("transfer")}
              className={`flex-1 p-2 rounded-xl border flex flex-col items-center text-xs font-bold ${
                paymentMethod === "transfer"
                  ? "bg-blue-100 border-blue-500 text-blue-800"
                  : "bg-white/60"
              }`}
            >
              <CreditCard className="w-4 h-4 mb-1" /> Transfer
            </button>
          </div>

          {paymentMethod === "transfer" ? (
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 text-blue-900 shadow-inner">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-500 mb-1">
                    Transfer Bank BSI
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-mono font-bold tracking-tight">
                      7218181818
                    </p>
                    <button
                      type="button"
                      onClick={() => copyToClipboard("7218181818")}
                      className="bg-blue-100 p-1.5 rounded-lg hover:bg-blue-200 text-blue-700 transition"
                      title="Salin No Rek"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs opacity-70 mt-1">
                    a.n IGS Business Day
                  </p>
                </div>
                <div className="bg-white p-1 rounded">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/a/a0/Bank_Syariah_Indonesia.svg"
                    className="h-6 w-auto"
                    alt="BSI"
                  />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-blue-200/50 text-xs flex flex-col gap-2 text-blue-700">
                <div className="flex gap-2 items-center">
                  <Clock className="w-3 h-3" />{" "}
                  <span>
                    Mohon transfer sesuai total:{" "}
                    <b>{formatRupiah(getTotalPrice())}</b>
                  </span>
                </div>

                {/* UPLOAD BUKTI TRANSFER */}
                <div className="mt-2">
                  <label className="block text-xs font-bold text-blue-800 mb-1">
                    Upload Bukti Transfer
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="transfer-proof-upload"
                    />
                    <label
                      htmlFor="transfer-proof-upload"
                      className="flex items-center justify-center gap-2 w-full p-2 bg-white border border-blue-300 border-dashed rounded-lg cursor-pointer hover:bg-blue-50 transition text-sm text-blue-600"
                    >
                      <Upload className="w-4 h-4" />{" "}
                      {transferProof ? "Ganti Foto" : "Pilih Foto"}
                    </label>
                  </div>
                  {transferProof && (
                    <img
                      src={transferProof}
                      className="h-20 w-auto rounded border border-blue-200 mt-2 mx-auto cursor-pointer"
                      onClick={() => setPreviewImage(transferProof)}
                    />
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 p-4 rounded-xl border border-green-200 text-green-900 shadow-inner flex items-start gap-3">
              <div className="bg-green-200 p-2 rounded-full text-green-700">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm">Bayar di Tempat</p>
                <p className="text-xs mt-1 opacity-80 leading-relaxed">
                  Silakan lakukan pembayaran tunai saat mengambil pesanan di
                  stand.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* TOMBOL CHECKOUT (DIPERBARUI) */}
        <div className="flex flex-col gap-3 mt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-purple-800 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-purple-900 transition flex justify-center items-center gap-2"
          >
            {isSubmitting ? (
              "Memproses..."
            ) : (
              <>
                <Send className="w-5 h-5" /> Kirim Pesanan
              </>
            )}
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              if (
                window.confirm(
                  "Yakin ingin membatalkan pesanan dan mengosongkan keranjang?"
                )
              ) {
                setCart({});
                setView("menu");
              }
            }}
            className="w-full bg-white/60 text-red-600 border border-red-300 py-3 rounded-xl font-bold shadow-sm hover:bg-red-50 transition"
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  );

  const renderMenu = () => {
    const filtered =
      activeCategory === "all"
        ? products
        : (products || []).filter((p) => p.category === activeCategory);
    return (
      <div className="max-w-md mx-auto p-4 space-y-4 pb-24 pt-6">
        {(!products || products.length === 0) && (
          <div className="text-center py-10 text-white/80">Menu Kosong</div>
        )}
        {(filtered || []).map((item) => {
          const qty = cart[item.id]?.qty || 0;
          const soldOut = item.stock <= 0;
          const isExp = expandedProductId === item.id;
          return (
            <div
              key={item.id}
              onClick={() => setExpandedProductId(isExp ? null : item.id)}
              className={`relative bg-white/40 backdrop-blur-lg p-3 rounded-2xl shadow-xl border border-white/40 overflow-hidden transition-all duration-300 ${
                soldOut ? "grayscale opacity-70" : ""
              } ${isExp ? "flex-col" : "flex gap-4"}`}
            >
              <div
                className={`bg-white/50 rounded-xl overflow-hidden relative shadow-inner shrink-0 ${
                  isExp ? "w-full h-48 mb-3" : "w-24 h-24"
                }`}
              >
                <img
                  src={item.image}
                  className="w-full h-full object-cover"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewImage(item.image);
                  }}
                />
                {qty > 0 && (
                  <div className="absolute top-0 left-0 bg-purple-700 text-white text-xs font-bold px-2 py-1 rounded-br-lg">
                    {qty}x
                  </div>
                )}
                {soldOut && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-xs">
                    HABIS
                  </div>
                )}
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between">
                    <h3
                      className={`font-bold text-gray-900 ${
                        isExp ? "text-xl" : "text-sm line-clamp-1"
                      }`}
                    >
                      {item.name}
                    </h3>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full h-fit font-bold ${
                        item.stock < 5
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      Sisa {item.stock}
                    </span>
                  </div>
                  <p
                    className={`text-xs text-gray-800 mt-1 ${
                      isExp ? "" : "line-clamp-2"
                    }`}
                  >
                    {item.description}
                  </p>
                </div>

                {/* MENU BUTTONS SECTION */}
                <div
                  className="flex justify-between items-end mt-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="font-bold text-purple-900">
                    {formatRupiah(item.price)}
                  </span>
                  {!soldOut &&
                    (qty === 0 ? (
                      <button
                        onClick={() => addToCart(item)}
                        className="bg-white/60 text-purple-900 px-4 py-1.5 text-xs font-bold rounded shadow hover:bg-white transition"
                      >
                        Beli
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 bg-white/60 p-1 rounded shadow">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-1.5 hover:bg-white rounded transition"
                        >
                          <Minus className="w-4 h-4 text-red-500" />
                        </button>
                        <span className="text-xs font-bold px-1 min-w-[1.5rem] text-center">
                          {qty}
                        </span>
                        <button
                          onClick={() => addToCart(item)}
                          className="p-1.5 hover:bg-white rounded transition"
                        >
                          <Plus className="w-4 h-4 text-purple-800" />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const getBgClass = () => {
    if (view === "general-admin") return "bg-slate-100";
    if (view === "login")
      return "bg-gradient-to-br from-purple-600 via-indigo-500 to-purple-800";
    return "bg-gradient-to-br from-purple-500 via-purple-400 to-fuchsia-400";
  };

  return (
    <div className={`min-h-screen font-sans relative ${getBgClass()}`}>
      {previewImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4 animate-fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <button className="absolute top-4 right-4 text-white">
            <X className="w-8 h-8" />
          </button>
          <img
            src={previewImage}
            className="max-w-full max-h-[80vh] rounded shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {view !== "login" && view !== "landing" && (
        <div
          className={`${
            view === "general-admin"
              ? "bg-slate-900"
              : "bg-white/20 backdrop-blur-md"
          } sticky top-0 z-50 px-4 py-4 shadow-lg flex justify-between items-center text-white`}
        >
          <div className="flex items-center gap-3">
            {view !== "menu" && (
              <button onClick={() => setView("menu")}>
                <ArrowLeft className="w-6 h-6" />
              </button>
            )}
            <div className="flex flex-col">
              <h1 className="font-bold text-lg drop-shadow-md">
                {view === "general-admin"
                  ? "Admin General"
                  : activeAdmin?.name || "IGS Business Day"}
              </h1>
              {!activeAdmin && (
                <p className="text-xs text-purple-100 font-medium">
                  Healthy Bites, Happy Life
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {activeAdmin && view === "menu" && (
              <button
                onClick={() =>
                  setView(
                    activeAdmin.role === "general" ? "general-admin" : "admin"
                  )
                }
                className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition"
              >
                <LayoutDashboard className="w-5 h-5" />
              </button>
            )}
            {activeAdmin ? (
              <button onClick={handleLogout}>
                <LogOut className="w-5 h-5" />
              </button>
            ) : (
              <button onClick={() => setView("login")}>
                <Lock className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      )}

      {view === "menu" && (
        <div className="px-4 pb-2 mt-2 flex gap-2 overflow-x-auto">
          {[
            { id: "all", icon: null, label: "Semua" },
            {
              id: "makanan",
              icon: <Utensils className="w-3 h-3" />,
              label: "Makanan",
            },
            {
              id: "minuman",
              icon: <Coffee className="w-3 h-3" />,
              label: "Minuman",
            },
          ].map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition ${
                activeCategory === c.id
                  ? "bg-purple-800 text-white"
                  : "bg-white/40 text-purple-900"
              }`}
            >
              {c.icon} {c.label}
            </button>
          ))}
        </div>
      )}

      {view === "landing" && renderLanding()}
      {view === "login" && renderLogin()}
      {view === "general-admin" && renderGeneralAdmin()}
      {view === "admin" && renderStandAdmin()}
      {view === "checkout" && renderCheckout()}

      {/* TAMPILAN INVOICE / SUCCESS (DIPERBARUI) */}
      {view === "success" && (
        <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 pb-24">
          <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-white/50 max-w-sm w-full relative">
            <div className="flex flex-col items-center mb-6">
              <CheckCircle className="w-16 h-16 text-green-500 mb-2" />
              <h2 className="text-2xl font-bold text-purple-900">
                Pesanan Berhasil!
              </h2>
              <p className="text-gray-600 text-sm text-center mt-1">
                Terima kasih telah berbelanja di Business Day SD Islamic Global
                School.
              </p>
              <p className="text-purple-600 text-xs text-center mt-1 font-bold">
                Silahkan download untuk bukti Pemesanan.
              </p>
            </div>

            {/* KARTU INVOICE / STRUK */}
            {lastOrderInfo && (
              <div ref={invoiceRef} className="bg-white p-2 -mx-2 mb-4">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-inner relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-2 bg-purple-500"></div>
                  <p className="text-center text-xs font-bold text-gray-500 tracking-widest mb-2">
                    INVOICE #{lastOrderInfo.id}
                  </p>
                  <div className="space-y-1 mb-4 border-b border-dashed border-gray-300 pb-3 text-sm">
                    <p className="flex justify-between">
                      <span className="text-gray-500">Pemesan:</span>{" "}
                      <span className="font-bold text-gray-800">
                        {lastOrderInfo.customer.name}
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-500">Kelas/Unit:</span>{" "}
                      <span className="font-bold text-gray-800">
                        {lastOrderInfo.customer.table}
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-500">Waktu:</span>{" "}
                      <span className="text-gray-800">
                        {lastOrderInfo.date.toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-500">Metode:</span>{" "}
                      <span className="font-bold text-gray-800">
                        {lastOrderInfo.customer.payment === "transfer"
                          ? "Transfer BSI"
                          : "Cash"}
                      </span>
                    </p>
                  </div>

                  <div className="space-y-2 mb-4 text-sm">
                    {lastOrderInfo.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span className="text-gray-800">
                          <span className="font-bold">{item.qty}x</span>{" "}
                          {item.name}
                        </span>
                        <span className="font-medium text-gray-800">
                          {formatRupiah(item.price * item.qty)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-dashed border-gray-300 pt-3 flex justify-between items-center">
                    <span className="font-bold text-gray-800">TOTAL</span>
                    <span className="font-extrabold text-purple-700 text-lg">
                      {formatRupiah(lastOrderInfo.totalPrice)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {lastOrderInfo && (
                <button
                  onClick={handleDownloadInvoice}
                  className="w-full bg-indigo-100 text-indigo-700 px-6 py-3 rounded-xl font-bold shadow-sm hover:bg-indigo-200 transition flex justify-center items-center gap-2"
                >
                  <DownloadCloud className="w-5 h-5" /> Download
                </button>
              )}
              <button
                onClick={() => {
                  setView("menu");
                  setLastOrderInfo(null);
                }}
                className="w-full bg-purple-800 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-purple-900 transition"
              >
                Kembali ke Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {view === "menu" && renderMenu()}

      {view === "menu" && getTotalItems() > 0 && (
        <div className="fixed bottom-6 left-0 right-0 px-4 z-40 max-w-md mx-auto animate-bounce-subtle">
          <button
            onClick={() => setView("checkout")}
            className="w-full bg-gray-900/90 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between border border-white/20"
          >
            <div className="flex items-center gap-3">
              <div className="bg-purple-500 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                {getTotalItems()}
              </div>
              <div className="text-left">
                <p className="text-xs text-gray-400">Total</p>
                <p className="font-bold text-lg leading-none">
                  {formatRupiah(getTotalPrice())}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 font-bold">
              Checkout <ShoppingCart className="w-5 h-5" />
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
