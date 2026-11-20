

import java.util.List;
import java.util.Map;

public interface SlaReportDAO {

    List<Map<String, Object>> getDistrictSlaReport();

    List<Map<String, Object>> getMandalSlaReport(String distCode);
}
