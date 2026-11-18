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

    // 1. Validasi Kelas (Nodes)
    nodesRule.forEach(ruleNode => {
        const ruleName = ruleNode.data?.name || "Unnamed Class";
        totalPossible += 1; // Poin untuk keberadaan kelas

        const studentNode = studentNodes.find(s =>
            s.data?.name?.toLowerCase() === ruleName.toLowerCase()
        );

        if (!studentNode) {
            feedbacks.push(`Kelas '${ruleName}' belum ditemukan dalam diagram Anda.`);
            return;
        }

        // Cek Properti Kelas (Abstract/Interface)
        let classTypeMatch = true;
        if (studentNode.data?.isAbstract === undefined && studentNode.data?.isInterface === undefined) {
            classTypeMatch = false;
            feedbacks.push(`Tipe kelas untuk '${ruleName}' belum dipilih. Silakan klik tombol CLASS, ABSTRACT, atau INTERFACE di panel diagram.`);
        } else {
            if (!!studentNode.data?.isAbstract !== !!ruleNode.data?.isAbstract) {
                classTypeMatch = false;
                feedbacks.push(`Pastikan sifat abstract/concrete pada kelas '${ruleName}' sudah sesuai dengan instruksi.`);
            }
            if (!!studentNode.data?.isInterface !== !!ruleNode.data?.isInterface) {
                classTypeMatch = false;
                feedbacks.push(`Pastikan tipe (Class vs Interface) untuk '${ruleName}' sudah benar.`);
            }
        }

        if (classTypeMatch) score += 1;

        // 2. Validasi Atribut
        const ruleAttrs = ruleNode.data?.attributes || [];
        if (ruleAttrs.length > 0) {
            let matchedAttrsCount = 0;
            const studentAttrs = studentNode.data?.attributes || [];

            ruleAttrs.forEach(rAttr => {
                totalPossible += 1;
                const isMatch = studentAttrs.some(sAttr =>
                    sAttr.name?.toLowerCase() === rAttr.name?.toLowerCase() &&
                    sAttr.type?.toLowerCase() === rAttr.type?.toLowerCase() &&
                    sAttr.access?.toLowerCase() === rAttr.access?.toLowerCase()
                );
                if (isMatch) {
                    score += 1;
                    matchedAttrsCount++;
                }
            });

            if (matchedAttrsCount < ruleAttrs.length) {
                feedbacks.push(`Beberapa atribut pada kelas '${ruleName}' belum sesuai atau belum lengkap (Periksa Nama, Tipe Data, dan Visibility).`);
            }
        }

        // 3. Validasi Method
        const ruleMethods = ruleNode.data?.methods || [];
        if (ruleMethods.length > 0) {
            let matchedMethodsCount = 0;
            const studentMethods = studentNode.data?.methods || [];

            ruleMethods.forEach(rMeth => {
                totalPossible += 1;
                const isMatch = studentMethods.some(sMeth =>
                    sMeth.name?.toLowerCase() === rMeth.name?.toLowerCase() &&
                    sMeth.returnType?.toLowerCase() === rMeth.returnType?.toLowerCase() &&
                    sMeth.access?.toLowerCase() === rMeth.access?.toLowerCase()
                );
                if (isMatch) {
                    score += 1;
                    matchedMethodsCount++;
                }
            });

            if (matchedMethodsCount < ruleMethods.length) {
                feedbacks.push(`Terdapat method pada kelas '${ruleName}' yang belum didefinisikan dengan benar.`);
            }
        }
    });

    // 4. Validasi Relasi (Edges)
    edgesRule.forEach(ruleEdge => {
        totalPossible += 1;
        const sourceClassName = ruleNodeIdToName[ruleEdge.source];
        const targetClassName = ruleNodeIdToName[ruleEdge.target];

        if (!sourceClassName || !targetClassName) return; // Rule rusak

        // Cari edge yang menghubungkan kelas yang sama
        const matchingEdges = studentEdges.filter(sEdge => {
            const sSource = studentNodeIdToName[sEdge.source];
            const sTarget = studentNodeIdToName[sEdge.target];
            // Mendukung arah yang benar (biasanya UML directed)
            return sSource === sourceClassName && sTarget === targetClassName;
        });

        if (matchingEdges.length === 0) {
            feedbacks.push(`Relasi antara kelas '${sourceClassName}' dan '${targetClassName}' belum ditemukan.`);
            return;
        }

        // Validasi Tipe Relasi (Generalization, Association, etc.)
        const ruleType = (ruleEdge.type || ruleEdge.data?.type || "").toLowerCase();
        const hasCorrectType = matchingEdges.some(sEdge => {
            const sType = (sEdge.type || sEdge.data?.type || "").toLowerCase();
            return sType === ruleType;
        });

        if (hasCorrectType) {
            score += 1;
        } else {
            feedbacks.push(`Tipe hubungan antara '${sourceClassName}' dan '${targetClassName}' masih belum tepat.`);
        }
    });

    // Cek apakah ada relasi mahasiswa yang berlebih atau tidak tepat (tidak 1:1)
    studentEdges.forEach(sEdge => {
        const sSource = studentNodeIdToName[sEdge.source];
        const sTarget = studentNodeIdToName[sEdge.target];
        const sType = (sEdge.type || sEdge.data?.type || "").toLowerCase();

        if (!sSource || !sTarget) {
            totalPossible += 1;
            feedbacks.push(`Terdapat relasi yang tidak terhubung dengan benar ke kelas.`);
            return;
        }

        // Cari apakah ada relasi yang sama di kunci jawaban (edgesRule)
        const matchedInRule = edgesRule.some(ruleEdge => {
            const rSource = ruleNodeIdToName[ruleEdge.source];
            const rTarget = ruleNodeIdToName[ruleEdge.target];
            const rType = (ruleEdge.type || ruleEdge.data?.type || "").toLowerCase();
            return rSource === sSource && rTarget === sTarget && rType === sType;
        });

        if (!matchedInRule) {
            totalPossible += 1;
            feedbacks.push(`Relasi '${sType.toUpperCase()}' dari '${sSource}' ke '${sTarget}' tidak diperlukan atau salah.`);
        }
    });

    // Kalkulasi Nilai Akhir
    const finalGrade = totalPossible > 0 ? Math.round((score / totalPossible) * 100) : 0;

    return {
        finalGrade,
        feedbacks: [...new Set(feedbacks)], // Hilangkan feedback duplikat
        isPassed: finalGrade === 100,
        // answerKey: { nodes: nodesRule, edges: edgesRule },
        // studentSubmission: { nodes: studentNodes, edges: studentEdges }
    };
};