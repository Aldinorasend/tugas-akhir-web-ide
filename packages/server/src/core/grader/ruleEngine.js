/**
 * Logika inti untuk membandingkan diagram mahasiswa dengan kunci jawaban.
 * Memberikan skor berdasarkan kelas, atribut, method, dan relasi secara granular.
 */
export const compareDiagrams = (studentNodes = [], studentEdges = [], rules) => {
    let score = 0;
    let totalPossible = 0;
    let feedbacks = [];

    const nodesRule = rules?.nodes || [];
    const edgesRule = rules?.edges || [];

    if (nodesRule.length === 0 && edgesRule.length === 0) {
        return {
            finalGrade: 0,
            feedbacks: ["Kunci jawaban (rules) belum dikonfigurasi. Harap hubungi pengajar."],
            isPassed: false
        };
    }

    // Helper Maps untuk resolusi ID ke Nama (Case-Insensitive)
    const ruleNodeIdToName = {};
    nodesRule.forEach(n => {
        if (n.id && n.data?.name) ruleNodeIdToName[n.id] = n.data.name.toLowerCase();
    });

    const studentNodeIdToName = {};
    studentNodes.forEach(n => {
        if (n.id && n.data?.name) studentNodeIdToName[n.id] = n.data.name.toLowerCase();
    });

    const normalizeAccess = (access) => {
    if (access === "+") return "public";
    if (access === "-") return "private";
    if (access === "#") return "protected";
    return access?.toLowerCase();
};
    // 1. Validasi Kelas (Nodes)
    nodesRule.forEach(ruleNode => {

        const ruleName = ruleNode.data?.name || "Unnamed Class";

        // --- REVISI: Hitung totalPossible di sini (sebelum pengecekan studentNode) ---
        totalPossible += 1; // Poin kelas
        const ruleAttrs = ruleNode.data?.attributes || [];
        const ruleMethods = ruleNode.data?.methods || [];
        console.log(ruleMethods);
        ruleAttrs.forEach(() => totalPossible += 1);
        ruleMethods.forEach(() => totalPossible += 1);
        // --------------------------------------------------------------------------

        const studentNode = studentNodes.find(s =>
            s.data?.name?.toLowerCase() === ruleName.toLowerCase()
        );

        if (!studentNode) {
            feedbacks.push(`Kelas '${ruleName}' belum ditemukan dalam diagram Anda.`);
            return;
        }

        // Cek Properti Kelas
        let classTypeMatch = true;
        if (studentNode.data?.isAbstract === undefined && studentNode.data?.isInterface === undefined) {
            classTypeMatch = false;
            feedbacks.push(`Tipe kelas untuk '${ruleName}' belum dipilih.`);
        } else {
            if (!!studentNode.data?.isAbstract !== !!ruleNode.data?.isAbstract ||
                !!studentNode.data?.isInterface !== !!ruleNode.data?.isInterface) {
                classTypeMatch = false;
                feedbacks.push(`Pastikan sifat/tipe pada kelas '${ruleName}' sudah benar.`);
            }
        }
        if (classTypeMatch) score += 1;

        // Validasi Atribut
        if (ruleAttrs.length > 0) {
            let matchedAttrsCount = 0;
            const studentAttrs = studentNode.data?.attributes || [];
            ruleAttrs.forEach(rAttr => {
                const isMatch = studentAttrs.some(sAttr =>
                    sAttr.name?.toLowerCase() === rAttr.name?.toLowerCase() &&
                    sAttr.type?.toLowerCase() === rAttr.type?.toLowerCase() &&
                    normalizeAccess(sAttr.access) === normalizeAccess(rAttr.access)

                );
                if (isMatch) { score += 1; matchedAttrsCount++; }
            });
            if (matchedAttrsCount < ruleAttrs.length) feedbacks.push(`Atribut di '${ruleName}' belum lengkap/sesuai.`);
        }

        // Validasi Method
        if (ruleMethods.length > 0) {
            let matchedMethodsCount = 0;
            const studentMethods = studentNode.data?.methods || [];
            ruleMethods.forEach(rMeth => {
                const normalizeParams = (params) => {
                    if (!params) return "";
                    return params.toLowerCase().replace(/\s/g, "");
                };
                const isMatch = studentMethods.some(sMeth =>
                    sMeth.name?.toLowerCase() === rMeth.name?.toLowerCase() &&
                    normalizeAccess(sMeth.access) === normalizeAccess(rMeth.access) &&
                    sMeth.returnType?.toLowerCase() === rMeth.returnType?.toLowerCase() &&
                    normalizeParams(sMeth.parameters) === normalizeParams(rMeth.parameters)
                );
                if (isMatch) { score += 1; matchedMethodsCount++; }
            });
            if (matchedMethodsCount < ruleMethods.length) feedbacks.push(`Method di '${ruleName}' belum sesuai.`);
        }
    });

    // 4. Validasi Relasi (Edges)
    // 4. Validasi Relasi (Edges)
    edgesRule.forEach(ruleEdge => {
        totalPossible += 1;

        const sourceName = ruleNodeIdToName[ruleEdge.source];
        const targetName = ruleNodeIdToName[ruleEdge.target];

        // Mapping tipe relasi dari string rule ke tipe yang dipakai di app
        // Kita buat logic agar "extends" menjadi "generalization" 
        // dan "implements" menjadi "realization"
        let ruleType = (ruleEdge.data?.type || "").toLowerCase();
        if (ruleType === 'extends') ruleType = 'inheritance';
        if (ruleType === 'implements') ruleType = 'interface';

        if (!sourceName || !targetName) return;

        const isMatch = studentEdges.some(sEdge => {
            const sSource = studentNodeIdToName[sEdge.source];
            const sTarget = studentNodeIdToName[sEdge.target];
            let sType = (sEdge.data?.type || "").toLowerCase();

            // Samakan juga tipe di sisi mahasiswa
            if (sType === 'extends') sType = 'inheritance';
            if (sType === 'implements') sType = 'interface';

            return sSource === sourceName &&
                sTarget === targetName &&
                sType === ruleType;
        });
        console.log(`[Rule Engine] Checking Edge: ${sourceName} -> ${targetName} (type: ${ruleType}) => Match: ${isMatch}`);
        if (isMatch) {
            score += 1;
        } else {
            feedbacks.push(`Relasi antara '${sourceName}' dan '${targetName}' (tipe: ${ruleType}) tidak sesuai.`);
        }
    });

    console.log('[Rule Engine] Total Score:', score, 'out of', totalPossible);
    const finalGrade = totalPossible > 0 ? Math.round((score / totalPossible) * 100) : 0;
    return { finalGrade, feedbacks: [...new Set(feedbacks)], isPassed: finalGrade === 100 };
};