import { modules as discoveredModules } from "./.generated/mockup-components";
import { useEffect, useState, type ComponentType } from "react";

export default function App() {
  const [componentsList, setComponentsList] = useState<{ name: string; Comp: ComponentType }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAllComponents() {
      const list: { name: string; Comp: ComponentType }[] = [];
      for (const key of Object.keys(discoveredModules)) {
        try {
          const mod = await discoveredModules[key]();
          const name = key.split('/').pop()?.replace('.tsx', '') || key;
          const comp = (mod.default || Object.values(mod).find(v => typeof v === 'function')) as ComponentType;
          if (comp) {
            list.push({ name, Comp: comp });
          }
        } catch (e) {
          console.error(e);
        }
      }
      setComponentsList(list);
      setLoading(false);
    }
    loadAllComponents();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif', direction: 'rtl' }}>
        <h3>جاري تشغيل واجهة منصة نُور AI...</h3>
      </div>
    );
  }

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif', direction: 'rtl', padding: '2rem' }}>
      <header style={{ textAlign: 'center', marginBottom: '3rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '1.5rem' }}>
        <h1 style={{ color: '#1e293b', fontSize: '2.5rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>منصة نُور AI</h1>
        <p style={{ color: '#64748b', fontSize: '1.1rem', margin: 0 }}>العرض التفاعلي الكامل للمستثمر - النسخة المستقلة</p>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        {componentsList.map(({ name, Comp }) => (
          <section key={name} style={{ background: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '2rem', border: '1px solid #e2e8f0' }}>
            <h2 style={{ color: '#2563eb', fontSize: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px dashed #cbd5e1', paddingBottom: '0.5rem', textTransform: 'capitalize' }}>
              قسم: {name}
            </h2>
            <div style={{ minHeight: '100px' }}>
              <Comp />
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
