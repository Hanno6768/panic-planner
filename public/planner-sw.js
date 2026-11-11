self.addEventListener("push", event => {
  if (!event.data) return;
  const {title,body,dueAt,url}=event.data.json();
  event.waitUntil(self.registration.showNotification(title,{body:body+(dueAt?" · Due "+new Date(dueAt).toLocaleString():""),icon:"/icon.png",data:{url}}));
});
self.addEventListener("notificationclick",event=>{
  event.notification.close();
  const url=new URL(event.notification.data.url,self.location.origin);
  if(url.origin===self.location.origin) event.waitUntil(clients.openWindow(url.href));
});
