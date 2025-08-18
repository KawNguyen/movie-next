# Báo cáo Files không sử dụng - Movie Next Project

## Files có thể xóa được:

### 1. `src/components/watch-history/continue-watching.tsx`

- **Trạng thái**: Không được import hoặc sử dụng ở đâu trong codebase
- **Lý do**: Có vẻ như đã được thay thế bởi `continue-watching-section.tsx`
- **Khuyến nghị**: Có thể xóa an toàn

### 2. `src/components/coming-soon.tsx`

- **Trạng thái**: Chỉ được export trong `src/lib/coming-soon.ts` nhưng không được sử dụng
- **Lý do**: Component được tạo nhưng không được implement trong UI
- **Khuyến nghị**: Có thể xóa nếu không có kế hoạch sử dụng

### 3. `src/lib/coming-soon.ts`

- **Trạng thái**: Export ComingSoon nhưng không được import ở đâu
- **Lý do**: File lib cho component coming-soon không được sử dụng
- **Khuyến nghị**: Có thể xóa cùng với coming-soon.tsx

### 4. `src/hooks/use-mobile.ts`

- **Trạng thái**: Hook được tạo nhưng không được sử dụng trong codebase
- **Lý do**: Có thể là hook được tạo để detect mobile device nhưng chưa được implement
- **Khuyến nghị**: Có thể xóa nếu không cần thiết, hoặc giữ lại nếu có kế hoạch sử dụng

## Files đang được sử dụng:

✅ `src/components/watch-history/continue-watching-section.tsx` - Được sử dụng trong home page  
✅ `src/components/watch-history/watch-history-card.tsx` - Được sử dụng trong watch history list  
✅ `src/components/watch-history/watch-history-list.tsx` - Component chính cho trang lịch sử  
✅ `src/hooks/use-debounce.ts` - Được sử dụng trong search components  
✅ `src/hooks/use-watch-events.ts` - Được sử dụng trong video player

## Khuyến nghị hành động:

1. **Xóa ngay lập tức** (an toàn 100%):
   - `src/components/watch-history/continue-watching.tsx`

2. **Có thể xóa** (nên kiểm tra kỹ trước):
   - `src/components/coming-soon.tsx`
   - `src/lib/coming-soon.ts`
   - `src/hooks/use-mobile.ts`

3. **Giữ lại** nếu có kế hoạch phát triển tính năng tương ứng trong tương lai

---

_Báo cáo được tạo tự động vào ngày: ${new Date().toLocaleDateString('vi-VN')}_
