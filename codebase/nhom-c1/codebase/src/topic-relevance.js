const fold = text => String(text || '').toLowerCase().replace(/đ/g, 'd').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const plants = /\b(cay|la cay|thuc vat|phan bon|quang hop|plant|plants|foliar|photosynthesis|fertilizer)\b/;
const humans = /\b(con nguoi|nguoi lon|tre em|tre nho|ba bau|thai phu|giam can|tang can|an kieng|human|pregnancy|weight loss|diet)\b/;

export function isPlantTopic(topic) { return plants.test(fold(topic)); }
export function isClearlyOffTopic(topic, text) {
  const content = fold(text);
  return isPlantTopic(topic) && humans.test(content) && !plants.test(content);
}
export function plantSearchContext(topic) {
  if (!isPlantTopic(topic)) return '';
  return /\b(dinh duong|nutrition|nutrient)\b/.test(fold(topic))
    ? ' thực vật sinh lý cây trồng dinh dưỡng khoáng'
    : ' thực vật cây trồng';
}
