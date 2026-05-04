export const gradeDiagram = (answerKey: any, studentDiagram: any) => {
    const masterNodes = answerKey.nodes || [];
    const studentNodes = studentDiagram.nodes || [];

    let points = 0;
    let maxPoints = 0;

    // 1. Loop ONLY through the Master Nodes to set the ceiling (Max Points)
    masterNodes.forEach((mNode: any) => {
        // 1 point for the Class existing
        maxPoints += 1;

        // Calculate max points for attributes and methods in this class
        maxPoints += (mNode.data.attributes?.length || 0);
        maxPoints += (mNode.data.methods?.length || 0);

        // 2. Find if the student has this specific class
        const sNode = studentNodes.find(
            (sn: any) => sn.data.name.toLowerCase().trim() === mNode.data.name.toLowerCase().trim()
        );

        if (sNode) {
            points += 1; // Student gets the point for the class

            // 3. Check Attributes (Student can only earn what is in the Master)
            mNode.data.attributes?.forEach((mAttr: any) => {
                const hasAttr = sNode.data.attributes?.some(
                    (sa: any) =>
                        sa.name.toLowerCase().trim() === mAttr.name.toLowerCase().trim() &&
                        sa.type.toLowerCase().trim() === mAttr.type.toLowerCase().trim()
                );
                if (hasAttr) points += 1;
            });

            // 4. Check Methods
            mNode.data.methods?.forEach((mMet: any) => {
                const hasMet = sNode.data.methods?.some(
                    (sm: any) =>
                        sm.name.toLowerCase().trim() === mMet.name.toLowerCase().trim() &&
                        sm.returnType.toLowerCase().trim() === mMet.returnType.toLowerCase().trim()
                );
                if (hasMet) points += 1;
            });
        }
    });

    // Final Safety Check
    if (maxPoints === 0) return 0;

    // Return a decimal (0.0 to 1.0)
    const finalScore = points / maxPoints;
    return Math.min(finalScore, 1); // Ensure it never goes above 100%
};