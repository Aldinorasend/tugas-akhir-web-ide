import { useState, useEffect, useRef } from 'react';

export const useDiagramTracker = () => {
    // 1. State Utama Metrik Diagram
    const [metrics, setMetrics] = useState({
        temporal: {
            time_spent_ms: 0,
            idle_time_ms: 0,
            max_single_idle_ms: 0,
        },
        spatial_churn: {
            total_actions: 0,
            node_add_count: 0,
            node_delete_count: 0,
            edge_add_count: 0,
            edge_delete_count: 0,
            component_modification_count: 0,
        },
        evaluation: {
            submit_count: 0,
            mismatch_attempts: 0,
        }
    });

    // Refs untuk tracking waktu secara akurat tanpa memicu re-render konstan
    const startTimeRef = useRef(Date.now());
    const lastActivityRef = useRef(Date.now());
    const currentIdleRef = useRef(0);
    const maxIdleRef = useRef(0);
    const accumulatedIdleRef = useRef(0);

    // 2. Loop Timer untuk Melacak Waktu (Setiap 1 Detik)
    useEffect(() => {
        const timer = setInterval(() => {
            const now = Date.now();

            // Hitung total waktu yang dihabiskan sejak awal membuka workspace
            const totalTimeSpent = now - startTimeRef.current;

            // Hitung waktu pasif sejak aktivitas terakhir
            const timeSinceLastActivity = now - lastActivityRef.current;

            // Threshold: Jika dalam 5 detik tidak ada pergerakan, hitung sebagai IDLE
            if (timeSinceLastActivity >= 5000) {
                currentIdleRef.current = timeSinceLastActivity;

                // Update single idle terlama jika idle saat ini memecahkan rekor
                if (currentIdleRef.current > maxIdleRef.current) {
                    maxIdleRef.current = currentIdleRef.current;
                }
            }

            // Update state secara berkala
            setMetrics((prev) => ({
                ...prev,
                temporal: {
                    time_spent_ms: totalTimeSpent,
                    idle_time_ms: accumulatedIdleRef.current + currentIdleRef.current,
                    max_single_idle_ms: maxIdleRef.current,
                }
            }));
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // 3. Fungsi Handler untuk Mereset Timer saat Mahasiswa Berinteraksi
    const logActivity = () => {
        // Jika sebelumnya mereka sedang idle, kunci durasi idle tersebut ke akumulator
        if (currentIdleRef.current > 0) {
            accumulatedIdleRef.current += currentIdleRef.current;
            currentIdleRef.current = 0;
        }
        lastActivityRef.current = Date.now();
    };

    // 4. Trigger Aksi Spesifik dari React Flow Event
    const trackAction = (actionType: any) => {
        logActivity(); // Setiap aksi otomatis mereset status idle

        setMetrics((prev) => {
            const updatedChurn = { ...prev.spatial_churn };
            updatedChurn.total_actions += 1;

            switch (actionType) {
                case 'NODE_ADD': updatedChurn.node_add_count += 1; break;
                case 'NODE_DELETE': updatedChurn.node_delete_count += 1; break;
                case 'EDGE_ADD': updatedChurn.edge_add_count += 1; break;
                case 'EDGE_DELETE': updatedChurn.edge_delete_count += 1; break;
                case 'COMPONENT_MOD': updatedChurn.component_modification_count += 1; break;
                default: break;
            }

            return { ...prev, spatial_churn: updatedChurn };
        });
    };

    // 5. Trigger saat klik tombol submit
    const trackSubmit = (isPassed: any) => {
        logActivity();
        setMetrics((prev) => ({
            ...prev,
            evaluation: {
                submit_count: prev.evaluation.submit_count + 1,
                mismatch_attempts: isPassed ? prev.evaluation.mismatch_attempts : prev.evaluation.mismatch_attempts + 1,
            }
        }));
    };

    const resetTracker = () => {
        startTimeRef.current = Date.now();
        lastActivityRef.current = Date.now();
        currentIdleRef.current = 0;
        maxIdleRef.current = 0;
        accumulatedIdleRef.current = 0;
    };

    return { diagramMetrics: metrics, trackAction, trackSubmit, resetTracker };
};