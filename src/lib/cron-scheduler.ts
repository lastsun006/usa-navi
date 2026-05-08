// cron-job.org API を使って指定時刻に1回だけエンドポイントを叩く

export async function scheduleCronJobAt(callRecordId: string, fireAt: Date): Promise<number> {
  const apiKey = process.env.CRON_JOB_API_KEY;
  if (!apiKey) {
    throw new Error("CRON_JOB_API_KEY未設定");
  }

  const cronSecret = process.env.CRON_SECRET ?? "";
  const url = `https://usa-navi-app.vercel.app/api/cron/fire-call?id=${callRecordId}`;

  // expiresAt は YYYYMMDDhhmmss 形式（発火1時間後に自動削除）
  const expiresDate = new Date(fireAt.getTime() + 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  const expiresAt = Number(
    `${expiresDate.getUTCFullYear()}${pad(expiresDate.getUTCMonth() + 1)}${pad(expiresDate.getUTCDate())}` +
    `${pad(expiresDate.getUTCHours())}${pad(expiresDate.getUTCMinutes())}${pad(expiresDate.getUTCSeconds())}`
  );

  const job = {
    url,
    enabled: true,
    title: `SoCal Navi: ${callRecordId}`,
    saveResponses: false,
    schedule: {
      timezone: "UTC",
      expiresAt,
      hours: [fireAt.getUTCHours()],
      minutes: [fireAt.getUTCMinutes()],
      mdays: [fireAt.getUTCDate()],
      months: [fireAt.getUTCMonth() + 1],
      wdays: [0, 1, 2, 3, 4, 5, 6], // 全曜日（曜日制限なし）
    },
    requestMethod: 0, // GET
    extendedData: {
      headers: { Authorization: `Bearer ${cronSecret}` },
    },
  };

  const res = await fetch("https://api.cron-job.org/jobs", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ job }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`cron-job.org 登録失敗: ${err}`);
  }

  const data = await res.json();
  console.log(`cron-job.org 登録成功: jobId=${data.jobId}, fireAt=${fireAt.toISOString()}`);
  return data.jobId as number;
}

// cron-job.org のジョブを削除
export async function deleteCronJob(jobId: number): Promise<void> {
  const apiKey = process.env.CRON_JOB_API_KEY;
  if (!apiKey) return;

  const res = await fetch(`https://api.cron-job.org/jobs/${jobId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) {
    console.error("cron-job.org 削除失敗:", jobId, await res.text());
  } else {
    console.log(`cron-job.org 削除成功: jobId=${jobId}`);
  }
}
