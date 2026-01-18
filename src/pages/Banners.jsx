import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
    collection,
    getDocs,
    doc,
    deleteDoc,
    addDoc,
    updateDoc,
    serverTimestamp,
    query,
    orderBy
} from "firebase/firestore";
import {
    MdViewCarousel,
    MdRefresh,
    MdAdd,
    MdEdit,
    MdDelete,
    MdSave,
    MdCancel,
    MdCheckCircle,
    MdErrorOutline,
    MdVisibility,
    MdVisibilityOff,
    MdDragHandle
} from "react-icons/md";

export default function Banners() {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Form states
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        title_en: "",
        title_tr: "",
        subtitle_en: "",
        subtitle_tr: "",
        description_en: "",
        description_tr: "",
        button_en: "",
        button_tr: "",
        targetScreen: "",
        icon: "ShoppingBag",
        color1: "#01615F",
        color2: "#047857",
        isActive: true,
        sortOrder: 0
    });

    const fetchBanners = async () => {
        try {
            setLoading(true);
            setError(null);
            const bannersRef = collection(db, "banners");
            const q = query(bannersRef, orderBy("sortOrder", "asc"));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setBanners(data);
        } catch (err) {
            console.error("Error fetching banners:", err);
            setError(`Failed to fetch banners: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBanners();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = {
                ...formData,
                colors: [formData.color1, formData.color2],
                sortOrder: parseInt(formData.sortOrder) || 0,
                updatedAt: serverTimestamp()
            };

            // Remove temporary color fields
            delete data.color1;
            delete data.color2;

            if (editingId) {
                await updateDoc(doc(db, "banners", editingId), data);
                alert("Banner updated successfully!");
            } else {
                data.createdAt = serverTimestamp();
                await addDoc(collection(db, "banners"), data);
                alert("Banner added successfully!");
            }

            resetForm();
            fetchBanners();
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };

    const resetForm = () => {
        setFormData({
            title_en: "",
            title_tr: "",
            subtitle_en: "",
            subtitle_tr: "",
            description_en: "",
            description_tr: "",
            button_en: "",
            button_tr: "",
            targetScreen: "",
            icon: "ShoppingBag",
            color1: "#01615F",
            color2: "#047857",
            isActive: true,
            sortOrder: banners.length
        });
        setEditingId(null);
        setShowAddForm(false);
    };

    const handleEdit = (banner) => {
        setEditingId(banner.id);
        setFormData({
            ...banner,
            color1: banner.colors?.[0] || "#01615F",
            color2: banner.colors?.[1] || "#047857"
        });
        setShowAddForm(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this banner?")) {
            await deleteDoc(doc(db, "banners", id));
            fetchBanners();
        }
    };

    return (
        <div style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "30px" }}>
                <h1 style={{ display: "flex", alignItems: "center", gap: "10px", margin: 0 }}>
                    <MdViewCarousel color="#01615F" /> Home Banners
                </h1>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button onClick={fetchBanners} style={styles.secondaryButton}><MdRefresh /> Refresh</button>
                    <button onClick={() => setShowAddForm(true)} style={styles.primaryButton}><MdAdd /> Add Banner</button>
                </div>
            </div>

            {showAddForm && (
                <div style={styles.formContainer}>
                    <h2 style={{ marginBottom: "20px" }}>{editingId ? "Edit Banner" : "New Banner"}</h2>
                    <form onSubmit={handleSubmit} style={styles.form}>
                        <div style={styles.formGrid}>
                            {/* English Content */}
                            <div style={styles.section}>
                                <h3>English Content</h3>
                                <input style={styles.input} placeholder="Title (EN)" value={formData.title_en} onChange={e => setFormData({ ...formData, title_en: e.target.value })} required />
                                <input style={styles.input} placeholder="Subtitle (EN)" value={formData.subtitle_en} onChange={e => setFormData({ ...formData, subtitle_en: e.target.value })} />
                                <input style={styles.input} placeholder="Description (EN)" value={formData.description_en} onChange={e => setFormData({ ...formData, description_en: e.target.value })} />
                                <input style={styles.input} placeholder="Button Text (EN)" value={formData.button_en} onChange={e => setFormData({ ...formData, button_en: e.target.value })} />
                            </div>

                            {/* Turkish Content */}
                            <div style={styles.section}>
                                <h3>Turkish Content</h3>
                                <input style={styles.input} placeholder="Title (TR)" value={formData.title_tr} onChange={e => setFormData({ ...formData, title_tr: e.target.value })} required />
                                <input style={styles.input} placeholder="Subtitle (TR)" value={formData.subtitle_tr} onChange={e => setFormData({ ...formData, subtitle_tr: e.target.value })} />
                                <input style={styles.input} placeholder="Description (TR)" value={formData.description_tr} onChange={e => setFormData({ ...formData, description_tr: e.target.value })} />
                                <input style={styles.input} placeholder="Button Text (TR)" value={formData.button_tr} onChange={e => setFormData({ ...formData, button_tr: e.target.value })} />
                            </div>

                            {/* Settings */}
                            <div style={styles.section}>
                                <h3>Settings & Style</h3>
                                <div style={{ display: "flex", gap: "10px" }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={styles.label}>Icon</label>
                                        <select style={styles.input} value={formData.icon} onChange={e => setFormData({ ...formData, icon: e.target.value })}>
                                            <option value="ShoppingBag">Shopping Bag</option>
                                            <option value="UserPlus">User Plus</option>
                                            <option value="Zap">Zap (Offer)</option>
                                            <option value="Star">Star</option>
                                            <option value="Gift">Gift</option>
                                        </select>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={styles.label}>Sort Order</label>
                                        <input type="number" style={styles.input} value={formData.sortOrder} onChange={e => setFormData({ ...formData, sortOrder: e.target.value })} />
                                    </div>
                                </div>

                                <input style={styles.input} placeholder="Target Screen (e.g. /ordersScreen)" value={formData.targetScreen} onChange={e => setFormData({ ...formData, targetScreen: e.target.value })} />

                                <div style={{ display: "flex", gap: "10px" }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={styles.label}>Color 1</label>
                                        <input type="color" style={styles.colorInput} value={formData.color1} onChange={e => setFormData({ ...formData, color1: e.target.value })} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={styles.label}>Color 2</label>
                                        <input type="color" style={styles.colorInput} value={formData.color2} onChange={e => setFormData({ ...formData, color2: e.target.value })} />
                                    </div>
                                </div>

                                <label style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px", cursor: "pointer" }}>
                                    <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} />
                                    Active
                                </label>
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
                            <button type="button" onClick={resetForm} style={styles.cancelButton}><MdCancel /> Cancel</button>
                            <button type="submit" style={styles.saveButton}><MdSave /> {editingId ? "Update" : "Save"} Banner</button>
                        </div>
                    </form>
                </div>
            )}

            <div style={styles.list}>
                {loading ? <p>Loading...</p> : banners.map(banner => (
                    <div key={banner.id} style={styles.card}>
                        <div style={{
                            width: "100px",
                            height: "60px",
                            borderRadius: "8px",
                            background: `linear-gradient(135deg, ${banner.colors?.[0]}, ${banner.colors?.[1]})`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            fontSize: "24px"
                        }}>
                            <MdViewCarousel />
                        </div>
                        <div style={{ flex: 1, marginLeft: "20px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <h4 style={{ margin: 0 }}>{banner.title_en} / {banner.title_tr}</h4>
                                {banner.isActive ? <MdVisibility color="#48BB78" /> : <MdVisibilityOff color="#A0AEC0" />}
                            </div>
                            <p style={{ margin: "5px 0", fontSize: "12px", color: "#718096" }}>
                                Target: {banner.targetScreen || "None"} | Icon: {banner.icon} | Order: {banner.sortOrder}
                            </p>
                        </div>
                        <div style={{ display: "flex", gap: "5px" }}>
                            <button onClick={() => handleEdit(banner)} style={styles.iconButton}><MdEdit /></button>
                            <button onClick={() => handleDelete(banner.id)} style={{ ...styles.iconButton, color: "#EF4444" }}><MdDelete /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

const styles = {
    primaryButton: { padding: "10px 20px", backgroundColor: "var(--primary)", color: "var(--text-white)", border: "none", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", fontWeight: "600" },
    secondaryButton: { padding: "10px 20px", backgroundColor: "var(--bg-white)", border: "1px solid var(--border)", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", color: "var(--text-medium)" },
    saveButton: { padding: "12px 24px", backgroundColor: "var(--primary)", color: "var(--text-white)", border: "none", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontWeight: "600" },
    cancelButton: { padding: "12px 24px", backgroundColor: "var(--bg-light)", border: "none", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", color: "var(--text-dark)" },
    formContainer: { backgroundColor: "var(--bg-white)", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", marginBottom: "30px", color: "var(--text-dark)" },
    formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "30px" },
    section: { display: "flex", flexDirection: "column", gap: "15px" },
    input: { padding: "12px", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "14px", backgroundColor: "var(--bg-light)", color: "var(--text-main)" },
    colorInput: { padding: "2px", height: "45px", border: "1px solid var(--border)", borderRadius: "8px", width: "100%", cursor: "pointer" },
    label: { fontSize: "12px", fontWeight: "600", color: "var(--text-light)", marginBottom: "5px", display: "block" },
    card: { display: "flex", alignItems: "center", backgroundColor: "var(--bg-white)", padding: "15px", borderRadius: "12px", marginBottom: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", color: "var(--text-main)" },
    iconButton: { background: "none", border: "none", padding: "8px", cursor: "pointer", fontSize: "20px", color: "var(--text-medium)", borderRadius: "6px" },
    list: { display: "flex", flexDirection: "column" }
};
