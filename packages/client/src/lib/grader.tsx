export const gradeDiagram = (answerKey: any, studentDiagram: any) => {
    const masterNodes = answerKey.nodes || [];
    const studentNodes = studentDiagram.nodes || [];

    let points = 0;
    let maxPoints = 0;
    const feedbacks: string[] = [];

    masterNodes.forEach((mNode: any) => {
        maxPoints += 1; // Poin Class
        maxPoints += (mNode.data.attributes?.length || 0);
        maxPoints += (mNode.data.methods?.length || 0);

        const sNode = studentNodes.find(
            (sn: any) => sn.data.name.toLowerCase().trim() === mNode.data.name.toLowerCase().trim()
        );

        if (!sNode) {
            feedbacks.push(`Class "${mNode.data.name}" belum ditemukan.`);
        } else {
            points += 1;

            // Cek Attributes
            mNode.data.attributes?.forEach((mAttr: any) => {
                const hasAttr = sNode.data.attributes?.some(
                    (sa: any) =>
                        sa.name.toLowerCase().trim() === mAttr.name.toLowerCase().trim() &&
                        sa.type.toLowerCase().trim() === mAttr.type.toLowerCase().trim()
                );
                if (hasAttr) {
                    points += 1;
                } else {
                    feedbacks.push(`Di Class ${mNode.data.name}, atribut "${mAttr.name}: ${mAttr.type}" belum sesuai.`);
                }
            });

            // Cek Methods
            mNode.data.methods?.forEach((mMet: any) => {
                const hasMet = sNode.data.methods?.some(
                    (sm: any) =>
                        sm.name.toLowerCase().trim() === mMet.name.toLowerCase().trim() &&
                        sm.returnType.toLowerCase().trim() === mMet.returnType.toLowerCase().trim()
                );
                if (hasMet) {
                    points += 1;
                } else {
                    feedbacks.push(`Di Class ${mNode.data.name}, method "${mMet.name}(): ${mMet.returnType}" belum sesuai.`);
                }
            });
        }
    });

    const score = maxPoints === 0 ? 0 : Math.min(points / maxPoints, 1);

    return {
        score,
        feedbacks, // Daftar kekurangan
        isPassed: score >= (answerKey.pass_threshold || 0.7)
    };
};